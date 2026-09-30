import { homedir } from 'node:os';
import { resolve } from 'node:path';

export const XCQT_DIR_NAME = '.xcqt';
export const XCQT_DIR_PATH = resolve(homedir(), XCQT_DIR_NAME);
export const QUEUE_DB_DIR = resolve(XCQT_DIR_PATH, 'store');
export const QUEUE_DB_FILE = resolve(QUEUE_DB_DIR, 'queue.db');
export const QUEUE_LOCK_PATH = resolve(XCQT_DIR_PATH, 'queue_consumer.lock')
