import { httpClient } from './httpClient';

/**
 * Create a new meeting on the backend.
 * @param {{ hostId?: string; title?: string; participants?: string[] }} payload
 */
export const createMeeting = async (payload: {
  hostId?: string;
  title?: string;
  participants?: string[];
}) => {
  try {
    const res = await httpClient.post('/meetings/create', payload);
    return res;
  } catch (err) {
    console.error('createMeeting error', err);
    throw err;
  }
};

export const getMeetingByRoomId = async (roomId: string) => {
  try {
    const res = await httpClient.get(`/meetings/${encodeURIComponent(roomId)}`);
    return res;
  } catch (err) {
    console.error('getMeetingByRoomId error', err);
    throw err;
  }
};
