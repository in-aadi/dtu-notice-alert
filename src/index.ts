import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';

const SITE_URL = 'https://dtu.ac.in';
const HISTORY_FILE = './history.json';

interface Notice {
  heading: string;
  pdfLink: string;
  uploadDate: string;
}

export async function checkForNewNotice(): Promise<void> {
  const res = await axios.get(SITE_URL);
  const $ = cheerio.load(res.data);

  const latestNotice = $('div#tab1 div.latest_tab ul li').first();

  const heading = latestNotice.find('h6 > a').text().trim();
  const rawLink = latestNotice.find('h6 > a').attr('href') || '';
  const pdfLink = new URL(rawLink, SITE_URL).href;
  const uploadDate = latestNotice.find('small > em > i').text().trim();

  const current: Notice = { heading, pdfLink, uploadDate };

  let previous: Notice | null = null;
  try {
    const data = await fs.readFile(HISTORY_FILE, 'utf-8');
    previous = JSON.parse(data);
  } catch (e) {
    console.log('📂 No history found. Creating new.');
  }

  if (!previous || previous.pdfLink !== current.pdfLink) {
    console.log('🆕 New notice detected!');
    console.log(current);
    await fs.writeFile(HISTORY_FILE, JSON.stringify(current, null, 2));
    // ⏭️ Call OCR or notification here
  } else {
    console.log('✅ No new notice.');
  }
}
