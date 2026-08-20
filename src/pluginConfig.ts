import type { ExternalPluginConfig } from '@windy/interfaces';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-fishing-assistant',
    version: '1.0.0',
    icon: '🎣',
    title: 'Windy 钓鱼助手',
    description:
        '面向钓鱼爱好者的气象助手：基于 Windy 气象数据计算当前与未来钓鱼指数，展示气压趋势、风力、温度、湿度、海浪、海表温度、日出日落与黄金时段等信息。',
    author: 'Fishing Assistant',
    repository: 'https://github.com/windycom/windy-plugin-template',
    desktopUI: 'rhpane',
    desktopWidth: 540,
    mobileUI: 'fullscreen',
    routerPath: '/fishing-assistant/:lat?/:lon?',

    // 允许从地图右键菜单打开，并自动传入经纬度
    addToContextmenu: true,

    // 插件打开时，单击地图可更换钓点
    listenToSingleclick: true,

    // 私有插件，不会出现在公共插件市场
    private: true,
};

export default config;

