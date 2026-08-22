import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://127.0.0.1:8000/api/v1';

const EMPLOYER = {
  email: 'selamtech@dreammore.com',
  password: 'DreamMore@2026',
  name: 'Selam Tech Solutions',
};

const FREELANCER = {
  email: 'abebe.tesfaye@dreammore.com',
  password: 'DreamMore@2026',
  name: 'Abebe Tesfaye',
};

const UNRELATED_USER = {
  email: 'meron.alemu@dreammore.com',
  password: 'DreamMore@2026',
  name: 'Meron Alemu',
};

const ADMIN = {
  email: 'admin@dreammore.com',
  password: 'DreamMore@2026',
  name: 'Dream More Admin',
};

console.log('E2E Verification runner starting...');
