import {env} from 'node:process';
import OSC from 'osc-js';
import SwitchBot from './switchBot';

const TOKEN: string = env.SWITCH_BOT_TOKEN ?? '';
const SECRET: string = env.SWITCH_BOT_SECRET ?? '';
const SLEEP_SCENE_ID: string = env.SLEEP_SCENE_ID ?? '';
const WAKE_UP_SCENE_ID: string = env.WAKE_UP_SCENE_ID ?? '';

const HOST: string = env.HOST ?? '127.0.0.1';
const IN_PORT: number = parseInt(env.IN_PORT ?? '9001', 10);
const PARAMETER_NAME: string = env.PARAMETER_NAME ?? '';

const switchBot: SwitchBot = new SwitchBot(TOKEN, SECRET);
const osc: OSC = new OSC({plugin: new OSC.DatagramPlugin()});
osc.open({host: HOST, port: IN_PORT});

type Message = {
    offset: number,
    address: string,
    types: string,
    args: string[] | number[] | boolean[],
};

osc.on(`/avatar/parameters/${PARAMETER_NAME}`, async (message: Message) => {
    if (typeof message.args[0] !== 'boolean') return console.error('パラメータはBool型にしてください');
    
    const [sceneId, sceneName]: [string, string] = (() => {
        if (message.args[0]) return [SLEEP_SCENE_ID, '就寝'];
        else return [WAKE_UP_SCENE_ID, '起床'];
    })();
    
    const executionResult: string = await switchBot.executeScene(sceneId)
        .then(() => '成功')
        .catch(error => {
            console.error(error);
            return '失敗';
        });
    
    console.log(`${sceneName}シーンの実行${executionResult}`);
});

osc.on('open', () => console.log('open'));

osc.on('error', (message: object) => console.error(message));