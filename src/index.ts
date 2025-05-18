import axios from 'axios';
import * as cheerio from 'cheerio';
import { db } from '../lib/db';

const SITE_URL = 'https://dtu.ac.in';

export async function checkForNewNotice(): Promise<void> {
  const res = await axios.get(SITE_URL);
  const $ = cheerio.load(res.data);

  const latestNotice = $('div#tab1 div.latest_tab ul li').first();

  const heading = latestNotice.find('h6 > a').text().trim();
  const rawLink = latestNotice.find('h6 > a').attr('href') || '';
  const pdfLink = new URL(rawLink, SITE_URL).href;
  const uploadDate = latestNotice.find('small > em > i').text().trim();

  try {
    const previous = await db.notice.findFirst({
      where: {
        pdfLink
      },
    });
  
    if (!previous) {
      await db.notice.create({
      data: {
          heading,
          pdfLink,
          uploadDate,
          embedded: false, 
        },
      });
      console.log('✅ New notice added:', heading);
    } else {
      console.log('No new notice found');
    }
  } catch (error) {
    console.error('Error checking for new notice:', error);
  }
}

checkForNewNotice();