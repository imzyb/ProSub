// functions/api/modules/constants.js

export const SUBVERTER_URL = 'api.v1.mk';

export const PREDEFINED_RULES = {
    Lan: ['FINAL,DIRECT,dns-failed'],
    Apple: ['RULE-SET,apple,DIRECT'],
    Microsoft: ['RULE-SET,microsoft,DIRECT'],
    Google: ['RULE-SET,google,🚀 PROXY'],
    Proxy: ['RULE-SET,proxy,🚀 PROXY'],
    Cn: ['RULE-SET,cn,DIRECT'],
    Telegram: ['RULE-SET,telegram,🚀 PROXY'],
    Private: ['RULE-SET,private,DIRECT'],
    Domestic: ['RULE-SET,domestic,DIRECT'],
    Ads: ['RULE-SET,ads,REJECT']
};

export const KV_KEY_NODES = 'prosub_nodes_v1';
export const KV_KEY_PROFILES = 'prosub_profiles_v1';
export const COOKIE_NAME = 'prosub_session';
export const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8小时