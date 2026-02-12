import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database.js';
import { cleanTranscript } from '../../config/groq.js';
import type { NormalizedFeedback, SlackEvent, ZoomEvent } from '../../types/index.js';
import axios from 'axios';

// Environment variables
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const MONITORED_CHANNELS = (process.env.MONITORED_CHANNELS || '').split(',');
const TICKET_EMOJI = '🎫';

/**
 * Normalize incoming payloads from various sources
 */
export function normalizePayload(
  source: string, 
  data: Record<string, any>
): NormalizedFeedback | null {
  try {
    switch (source.toLowerCase()) {
      case 'slack':
        return {
          source: 'slack',
          external_id: data.ts || data.message_ts || uuidv4(),
          content: data.text || data.content || '',
          author_email: data.user_email,
          author_name: data.user_name,
          timestamp: new Date(parseFloat(data.ts || '0') * 1000),
          metadata: {
            channel: data.channel,
            thread_ts: data.thread_ts,
            permalink: data.permalink
          }
        };

      case 'zoom':
        return {
          source: 'zoom',
          external_id: data.uuid || uuidv4(),
          content: data.transcript || '',
          author_email: data.host_email,
          author_name: data.host_name,
          timestamp: new Date(),
          metadata: {
            meeting_topic: data.topic,
            recording_url: data.recording_url,
            duration: data.duration
          }
        };

      case 'freshdesk':
        return {
          source: 'freshdesk',
          external_id: data.ticket_id?.toString() || uuidv4(),
          content: data.description || data.content || '',
          author_email: data.requester_email,
          author_name: data.requester_name,
          timestamp: new Date(data.created_at || Date.now()),
          metadata: {
            ticket_url: data.ticket_url,
            priority: data.priority,
            status: data.status
          }
        };

      case 'manual':
      default:
        return {
          source: 'manual',
          external_id: data.id || uuidv4(),
          content: data.content || '',
          author_email: data.author_email,
          author_name: data.author_name,
          timestamp: new Date(),
          metadata: data.metadata || {}
        };
    }
  } catch (error) {
    console.error('Error normalizing payload:', error);
    return null;
  }
}

/**
 * Process Slack events
 */
export async function processSlackEvent(event: SlackEvent): Promise<void> {
  const { type, event: slackEvent } = event;

  if (type === 'event_callback') {
    switch (slackEvent.type) {
      case 'reaction_added':
        // Check if it's the ticket emoji
        if (slackEvent.reaction === TICKET_EMOJI.codePointAt(0)?.toString(16) || 
            slackEvent.reaction === 'ticket') {
          await handleTicketReaction(slackEvent);
        }
        break;

      case 'message':
        // Check if message is in monitored channel
        if (MONITORED_CHANNELS.includes(slackEvent.channel)) {
          await handleMonitoredMessage(slackEvent);
        }
        break;
    }
  }
}

/**
 * Handle 🎫 reaction - fetch message and create feedback
 */
async function handleTicketReaction(event: SlackEvent['event']): Promise<void> {
  if (!event.item || event.item.type !== 'message') return;

  try {
    // Fetch the original message
    const response = await axios.get('https://slack.com/api/conversations.history', {
      headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
      params: {
        channel: event.item.channel,
        latest: event.item.ts,
        limit: 1,
        inclusive: true
      }
    });

    if (response.data.ok && response.data.messages?.length > 0) {
      const message = response.data.messages[0];
      
      // Get user info for email
      const userInfo = await getSlackUserInfo(message.user);
      
      // Get permalink
      const permalinkRes = await axios.get('https://slack.com/api/chat.getPermalink', {
        headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
        params: {
          channel: event.item.channel,
          message_ts: event.item.ts
        }
      });

      const normalized = normalizePayload('slack', {
        ts: message.ts,
        text: message.text,
        channel: event.item.channel,
        user_email: userInfo?.email,
        user_name: userInfo?.name,
        permalink: permalinkRes.data.permalink,
        thread_ts: message.thread_ts
      });

      if (normalized) {
        await saveFeedback(normalized);
        console.log('✅ Feedback captured from Slack reaction');
      }
    }
  } catch (error) {
    console.error('Error handling ticket reaction:', error);
  }
}

/**
 * Handle messages in monitored channels
 */
async function handleMonitoredMessage(event: SlackEvent['event']): Promise<void> {
  try {
    // Skip bot messages and thread replies (to avoid noise)
    if (event.user?.startsWith('B') || (event as any).subtype) return;

    const userInfo = await getSlackUserInfo(event.user);
    
    // Get permalink
    const permalinkRes = await axios.get('https://slack.com/api/chat.getPermalink', {
      headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
      params: {
        channel: event.channel,
        message_ts: event.ts
      }
    });

    const normalized = normalizePayload('slack', {
      ts: event.ts,
      text: event.text,
      channel: event.channel,
      user_email: userInfo?.email,
      user_name: userInfo?.name,
      permalink: permalinkRes.data?.permalink
    });

    if (normalized && normalized.content.trim()) {
      await saveFeedback(normalized);
      console.log('✅ Feedback captured from monitored channel');
    }
  } catch (error) {
    console.error('Error handling monitored message:', error);
  }
}

/**
 * Get Slack user info including email
 */
async function getSlackUserInfo(userId: string): Promise<{ email?: string; name?: string } | null> {
  try {
    const response = await axios.get('https://slack.com/api/users.info', {
      headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
      params: { user: userId }
    });

    if (response.data.ok) {
      return {
        email: response.data.user.profile?.email,
        name: response.data.user.real_name || response.data.user.name
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching Slack user info:', error);
    return null;
  }
}

/**
 * Process Zoom events (transcript completed)
 */
export async function processZoomEvent(event: ZoomEvent): Promise<void> {
  if (event.event !== 'recording.transcript.completed') return;

  const { object } = event.payload;
  
  try {
    // Find VTT transcript file
    const vttFile = object.recording_files?.find(
      f => f.file_type === 'TRANSCRIPT'
    );

    if (!vttFile) {
      console.log('No transcript file found in Zoom recording');
      return;
    }

    // Download VTT content
    const vttContent = await downloadZoomTranscript(vttFile.download_url);
    
    // Clean transcript using Groq
    const cleanedTranscript = await cleanTranscript(vttContent);

    const normalized = normalizePayload('zoom', {
      uuid: object.uuid,
      topic: object.topic,
      transcript: cleanedTranscript,
      recording_url: vttFile.download_url
    });

    if (normalized) {
      await saveFeedback(normalized);
      console.log('✅ Zoom transcript processed and saved');
    }
  } catch (error) {
    console.error('Error processing Zoom event:', error);
  }
}

/**
 * Download Zoom transcript file
 */
async function downloadZoomTranscript(url: string): Promise<string> {
  const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
  const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
  const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;

  // Get access token
  const tokenResponse = await axios.post(
    'https://zoom.us/oauth/token',
    null,
    {
      params: {
        grant_type: 'account_credentials',
        account_id: ZOOM_ACCOUNT_ID
      },
      auth: {
        username: ZOOM_CLIENT_ID || '',
        password: ZOOM_CLIENT_SECRET || ''
      }
    }
  );

  // Download transcript
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
  });

  return response.data;
}

/**
 * Process manual feedback submission
 */
export async function processManualFeedback(normalized: NormalizedFeedback): Promise<string> {
  return await saveFeedback(normalized);
}

/**
 * Save normalized feedback to database
 */
async function saveFeedback(feedback: NormalizedFeedback): Promise<string> {
  const id = uuidv4();
  
  await query(`
    INSERT INTO feedback (id, source, external_id, content, author_email, author_name, metadata, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO NOTHING
  `, [
    id,
    feedback.source,
    feedback.external_id,
    feedback.content,
    feedback.author_email || null,
    feedback.author_name || null,
    JSON.stringify(feedback.metadata),
    feedback.timestamp
  ]);

  // Trigger async processing (identity resolution + feature extraction)
  setImmediate(async () => {
    try {
      const { resolveFeedbackIdentity } = await import('../identifier/service.js');
      const { processFeedback } = await import('../synthesizer/service.js');
      
      await resolveFeedbackIdentity(id);
      await processFeedback(id);
    } catch (error) {
      console.error('Error in async feedback processing:', error);
    }
  });

  return id;
}

/**
 * Parse VTT content to clean text
 */
export function parseVTT(vttContent: string): string {
  // Remove WEBVTT header and timestamps
  const lines = vttContent.split('\n');
  const textLines: string[] = [];
  
  for (const line of lines) {
    // Skip WEBVTT header, timestamps, and empty lines
    if (line.startsWith('WEBVTT') || 
        line.match(/^\d{2}:\d{2}/) ||
        line.match(/-->/) ||
        line.trim() === '') {
      continue;
    }
    textLines.push(line.trim());
  }
  
  return textLines.join(' ');
}

