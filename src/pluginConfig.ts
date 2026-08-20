import type { ExternalPluginConfig } from '@windy/interfaces';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-fishing-assistant',
    version: '1.0.1',
    icon: '🎣',
    title: 'Windy Fishing Assistant',
    description:
        'A weather assistant for anglers: calculates the current and future fishing index from Windy data, with pressure trend, wind, temperature, humidity, waves, sea surface temperature, sunrise/sunset and prime-time windows. Supports English & 简体中文.',
    author: 'HarryChen-10086',
    repository: 'https://github.com/HarryChen-10086/windy-plugin-fishing-assistant',
    desktopUI: 'rhpane',
    desktopWidth: 540,
    mobileUI: 'fullscreen',
    routerPath: '/fishing-assistant/:lat?/:lon?',

    // 允许从地图右键菜单打开，并自动传入经纬度
    addToContextmenu: true,

    // 插件打开时，单击地图可更换钓点
    listenToSingleclick: true,

    // 私有插件，不会出现在公共插件市场
    private: false,
};

export default config;

