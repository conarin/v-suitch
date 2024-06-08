import { env } from 'node:process';
import OSC from 'osc-js';
import SwitchBot from './switchBot';

const TOKEN: string = env.SWITCH_BOT_TOKEN ?? '';
const SECRET: string = env.SEITCH_BOT_SECRET ?? '';
const SLEEP_SCENE_ID: string = env.SLEEP_SCENE_ID ?? '';
const WAKE_UP_SCENE_ID: string = env.WAKE_UP_SCENE_ID ?? '';

const HOST: string = env.HOST ?? '127.0.0.1';
const IN_PORT: number = parseInt(env.IN_PORT ?? '9001', 10);
const PARAMETER_NAME: string = env.PARAMETER_NAME ?? '';

const switchBot: SwitchBot = new SwitchBot(TOKEN, SECRET);
const osc: OSC = new OSC({ plugin: new OSC.DatagramPlugin() });
osc.open({ host: HOST, port: IN_PORT });

type Message = {
    offset: number,
    address: string,
    types: string,
    args: string[] | number[] | boolean[],
};

osc.on(`/avatar/parameters/${PARAMETER_NAME}`, async (message: Message) => {
    if (typeof message.args[0] !== 'boolean') return console.error('パラメーターはBool型にしてください');
    
    if (message.args[0]) await switchBot.executeScene(SLEEP_SCENE_ID);
    else await switchBot.executeScene(WAKE_UP_SCENE_ID);
});