'use strict';

/**
 * 获得各种配置
 */

const path = require('path');
const chalk = require('chalk');
const os = require('os');
const fs = require('fs');

// 缓存读取结果以提高性能
let siteConf, originRouterMap, routerMap, serverConf, extendsLoader, staticRouterMap, IP;

module.exports = {
    // 取得运行环境
    getEnv: () => process.env.NODE_ENV || 'local',

    // 取得站点配置
    getSiteConf() {
        // 读取过直接返回
        if (!!siteConf) {
            return siteConf;
        }

        const env = process.env;
        siteConf = {
            'host': '',
            'port': '',
            'stat': false,
            'path': '',
            'static_conf_file': 'static_routermap',
            'server_conf_file': 'server',
            'routermap_file': 'routermap',
            'static_routermap_file': 'static_routermap'
        };

        // 读取合并当前站点配置
        const config = JSON.parse(env.config);
        siteConf = Object.assign(siteConf, config);

        // 环境变量 CONFIG_FILE 设置为 on 时,兼容旧有配置文件形式
        if (env.CONFIG_FILE === 'on') {
            const NODE_SITE = env.NODE_SITE || 'local';
            const NODE_ENV = this.getEnv();
            const config = require('../config/' + NODE_SITE);
            siteConf = Object.assign(siteConf, config[NODE_ENV]);
        }
        return siteConf;
    },

    // 取得未处理的动态路由
    getOriginRouterMap(){
        if (!!originRouterMap) {
            return originRouterMap;
        }
        
        const siteConf = this.getSiteConf();
        const configPath = path.join(siteConf.path, siteConf.routermap_file);
        try {
            // 读取站点路由配置
            originRouterMap = require(configPath);
        } catch (err) {
            // 没有的话空转
            console.log(chalk.red('No File %s , empty.'), configPath);
            originRouterMap = {};
        }
        return originRouterMap;
    },

    // 取得动态路由映射
    getRouterMap() {
        // 读取过直接返回
        if (!!routerMap) {
            return routerMap;
        }
        
        routerMap = this.getOriginRouterMap();

        // 检查routerMap的数据格式，补全
        let parsedRoutes = {};

        for (let k of Object.keys(routerMap)) {
            const v = routerMap[k];
            let reqPath = '';
            let domain = '_';

            // path 结尾没有 ／ 的补全
            if (!k.endsWith('/')) {
                k = k + '/';
            }
            let pos = k.indexOf('/');
            
            // 如routerMap中path开以 / 开头,则理解成无配置域名,用默认domain '_' 代替域名
            if (pos === 0) {
                reqPath = k;

            // 如果配置域名，则把域名提取出来
            } else {
                domain = k.substr(0, pos);
                reqPath = k.substr(pos);

                // 如果views没有补全域名,则补全域名
                if (!!v.views && !v.views.startsWith('/' + domain) && !v.views.startsWith(domain)) {
                    v.views = domain + v.views;
                }
            }

            // 输出改为 {path: {domain: {views && cgi }}} 的格式
            if (!parsedRoutes[reqPath]) {
                parsedRoutes[reqPath] = {};
            }
            parsedRoutes[reqPath][domain] = v;
        }

        routerMap = parsedRoutes;
        return parsedRoutes;
    },

    // 取得服务server配置
    getServerConf() {
        // 读取过直接返回
        if (!!serverConf) {
            return serverConf;
        }

        const siteConf = this.getSiteConf();
        const env = this.getEnv();
        const configPath = path.join(siteConf.path, siteConf.server_conf_file);
        try {
            // 读取站点路由配置
            serverConf = require(configPath);
            serverConf = serverConf.genConf ? serverConf.genConf[env] : serverConf[env];
        } catch (err) {
            // 没有的话空转
            console.log(chalk.red('No File %s , empty.'), configPath);
            serverConf = {
                views: {
                    path: path.join(__dirname, '../views/empty')
                },
                index: {
                    path: path.join(__dirname, '../views/empty')
                }
            };
        }
        return serverConf;
    },

    // 取得extends加载器
    getExtendsLoader() {
        // 读取过直接返回
        if (!!extendsLoader) {
            return extendsLoader;
        }

        const siteConf = this.getSiteConf();
        let loaderPath = path.join(siteConf.path, siteConf.extends_file);
        try {
            extendsLoader = require(loaderPath);
        } catch (err) {
            loaderPath = path.join(siteConf.path, siteConf.extends_file, 'loader');
            try {
                extendsLoader = require(loaderPath);
            } catch (e) {
                console.log('No extends file.');
            }
        }
        return extendsLoader;
    },

    // 取得静态路由映射
    getStaticRouterMap() {
        // 读取过直接返回
        if (!!staticRouterMap) {
            return staticRouterMap;
        }

        const siteConf = this.getSiteConf();
        const configPath = path.join(siteConf.path, siteConf.static_routermap_file);
        try {
            // 读取站点路由配置
            staticRouterMap = require(configPath);
        } catch (err) {
            // 没有的话空转
            console.log(chalk.red('No File %s , empty.'), configPath);
            staticRouterMap = {};
        }
        return staticRouterMap;
    },

    // 取得ip
    getIP() {
        // 读取过直接返回
        if (!!IP) {
            return IP;
        }

        const interfaces = os.networkInterfaces();

        let addresses = [];
        for (let k in interfaces) {
            for (let k2 in interfaces[k]) {
                let address = interfaces[k][k2];
                if (address.family === 'IPv4' && !address.internal) {
                    addresses.push(address.address);
                }
            }
        }

        IP = addresses[0];
        return IP;
    }
};

