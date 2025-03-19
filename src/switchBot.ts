import * as crypto from 'node:crypto';

type Method = 'GET' | 'PUT' | 'POST' | 'DELETE';
type Options = {
    method: Method,
    headers: {
        Authorization: string,
        sign: string,
        nonce: string,
        t: string,
        'Content-Type'?: string,
        'Content-Length'?: string,
    },
    body?: string,
};

type Body = {
    parameter?: string | number | {[key: string]: string | number},
    commandType?: string,
    command: string,
};

/**
 * SwitchBotAPI
 * https://github.com/OpenWonderLabs/SwitchBotAPI
 */
export default class SwitchBot {
    private readonly TOKEN: string;
    private readonly SECRET: string;

    constructor(token: string, secret: string) {
        this.TOKEN = token;
        this.SECRET = secret;
    }

    private sign(t: string, nonce: string): string {
        const data: string = this.TOKEN + t + nonce;
        return crypto.createHmac('sha256', this.SECRET)
            .update(Buffer.from(data, 'utf-8'))
            .digest()
            .toString('base64');
    }

    private options(method: Method, body?: Body): Options {
        const t: string = Date.now().toString();
        const nonce: string = crypto.randomUUID();
        const options: Options = {
            method: method,
            headers: {
                'Authorization': this.TOKEN,
                'sign': this.sign(t, nonce),
                't': t,
                'nonce': nonce,
            }
        };
        if (method === 'POST') options.headers['Content-Type'] = 'application/json; charset=utf8';
        if (typeof body !== 'undefined') {
            options.body = JSON.stringify(body);
            options.headers['Content-Length'] = options.body.length.toString();
        }

        return options;
    }

    private async fetch(url: string, options: Options): Promise<object> {
        return fetch(new URL(url, 'https://api.switch-bot.com'), options)
            .then(res => {
                if (res.ok) return res.json();
                throw new Error(`${res.status}: ${res.statusText}`);
            }).then(res => {
                if (res?.statusCode === 100) return res;
                throw new Error(res.message);
            });
    }

    /**
     * 物理デバイスと仮想デバイスの一覧を取得する。
     * https://github.com/OpenWonderLabs/SwitchBotAPI?tab=readme-ov-file#get-device-list
     */
    public fetchDevices(): Promise<object> {
        return this.fetch('/v1.1/devices', this.options('GET'));
    }

    /**
     * 物理デバイスのステータスを取得する。
     * https://github.com/OpenWonderLabs/SwitchBotAPI?tab=readme-ov-file#get-device-status
     * @param deviceId
     */
    public fetchDeviceStatus(deviceId: string): Promise<object> {
        return this.fetch(`/v1.1/devices/${encodeURIComponent(deviceId)}/status`, this.options('GET'));
    }

    /**
     * 物理デバイスまたは仮想デバイスに制御コマンドを送信する。
     * https://github.com/OpenWonderLabs/SwitchBotAPI?tab=readme-ov-file#send-device-control-commands
     * @param deviceId
     * @param body
     */
    public sendCommand(deviceId: string, body: Body): Promise<object> {
        return this.fetch(`/v1.1/devices/${encodeURIComponent(deviceId)}/commands`, this.options('POST', body));
    }

    /**
     * シーンの一覧を取得する。
     * https://github.com/OpenWonderLabs/SwitchBotAPI?tab=readme-ov-file#get-scene-list
     */
    public fetchScenes(): Promise<object> {
        return this.fetch('/v1.1/scenes', this.options('GET'));
    }

    /**
     * シーンを実行する。
     * https://github.com/OpenWonderLabs/SwitchBotAPI?tab=readme-ov-file#execute-manual-scenes
     * @param sceneId
     */
    public executeScene(sceneId: string): Promise<object> {
        return this.fetch(`/v1.1/scenes/${encodeURIComponent(sceneId)}/execute`, this.options('POST'));
    }
}