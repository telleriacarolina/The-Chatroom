// Shared exports for The Chatroom monorepo
export * from './types';
export * from './utils';

const socketProtocol = require('./socketProtocol.js');

export const SOCKET_EVENTS = socketProtocol.SOCKET_EVENTS;
export const SOCKET_ERROR_CODES = socketProtocol.SOCKET_ERROR_CODES;
