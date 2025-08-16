export const MASTER_RESPONSE = {
  UNKNOWN_GAME_TYPE: '2',
  SERVER_FULL: '3',
  NO_MATCHING_GAME: '4',
  SUCCESS: '5',
  INVALID_NAME: '6',
  UPDATE: '9',
}

export enum LEVEL {
  ALHAMBRA = 1,
  DIE_INSELN = 2,
  DIE_BRUECKEN = 3,
  // this last one is crashing the game
  DIE_PYRAMIDE = 4,
}

export enum GAME_TYPE {
  NORMAL = 1,
  TEAM = 2,
  // I don't think CTF ever existed
  CTF = 3,
}

export enum WEAPON {
  LIQUIDATOR = 0,
  WATERMINATOR = 1,
  TRIPLE_SHOT = 2,
  ARCTIC_SHOCK = 3,
  WASSERBOMBEN_ARMBRUST = 4,
  WASSERBOMBEN_EXPLOSION = 9,
}

export enum FIGUR {
  HERR_WOLF = 1,
  GERTRUDE = 2,
  LISA = 3,
  CHRIS = 4,
}

export enum GAME_PACKET {
  KEEP_ALIVE = 255,
  PLAYER_JOIN_REQUEST = 254,
  PLAYER_LEFT = 253,
  PLAYER_JOIN_SUCCESS = 252,
  HOST_DISCONNECT = 251,
  ALIVE_REQUEST = 250,
  PLAYER_KICKED = 249,
  GAME_CHANGE = 248,
  POSITION_UPDATE = 1,
  GAME_STATE = 2,
  CONFIRM_RECEIVE = 3,
}

export enum JOIN_TYPE {
  REQUEST = 1,
  SUCCESS = 2,
  FAILURE = 3,
}

export enum LEAVE_TYPE {
  LEFT = 1,
  LOST = 0,
}

export enum JOIN_FAIL_REASON {
  BANNED = 1,
  NO_ROOM = 2,
  CANCEL = 5,
}

export const POSITION_UPDATE_TYPE = {
  OUTBOUND: '1',
  RELIABLE: '2',
}

export enum GAME_STATE_TYPE {
  NEW_PLAYER = 4,
  TEAM_UPDATE = 5,
  GAME_STATE = 6,
  PLAYER_READY = 7,
  GAME_TIME = 8,
  FIRE = 10,
  FIRE_STOP = 11,
  SCORE_UPDATE = 14,
  FIGUR_UPDATE = 15,
  OUT_OF_MAP = 17,
  PICKUP_WEAPON = 18,
  PICKUP_ITEM = 19,
  PLAYER_DIED = 20,
  PLAYER_SELF_DIED = 21,
  SOUND = 22,
  CHAT = 23,
  ALL_SCORE = 24,
  KICKED = 89,
}

export enum FIGURE_SOUND {
  STAND = 1,
  HIT1 = 2,
  HIT2 = 3,
  HIT3 = 4,
  HIT4 = 5,
  HIT5 = 6,
  HIT6 = 7,
  HIT7 = 8,
  HIT8 = 9,

  GOTHIT1 = 10,
  GOTHIT2 = 11,
  GOTHIT3 = 12,
  GOTHIT4 = 13,
  GOTHIT5 = 14,

  WATER1 = 15,
  WATER2 = 16,
  WATER3 = 17,

  DEAD1 = 18,
  DEAD2 = 19,
  DEAD3 = 20,

  ARMOR = 21,
  SPEED = 22,

  F1 = 23,
  F2 = 24,
  F3 = 25,
  F4 = 26,

  DEAD = 27,
  BEAM = 28,
}

export enum ITEM_TYPE {
  TOWEL = 1,
  SPEED = 2,
  ARMOR = 3,
  WATER = 4,
}
