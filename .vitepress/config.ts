import { defineConfig } from 'vitepress'
import type { MarkdownRenderer } from 'vitepress'
import { withPwa } from '@vite-pwa/vitepress'
import { webUpdateNotice } from '@plugin-web-update-notification/vite'

// md 添加自定义属性
function MdCustomAttrPugin(md: MarkdownRenderer, type: string, mdOptions: object) {
  const defaultRenderer = md.renderer.rules[type]

  if (defaultRenderer) {
    md.renderer.rules[type] = (tokens, idx, options, env, self) => {
      const token = tokens[idx]
      if (mdOptions) {
        for (let i in mdOptions) {
          token.attrSet(i, mdOptions[i])
        }
      }
      return defaultRenderer(tokens, idx, options, env, self)
    }
  }
}

// https://vitepress.dev/reference/site-config
export default withPwa(
  defineConfig({
    vite: {
      plugins: [
        webUpdateNotice({
          notificationProps: {
            title: '更新提醒',
            description: '系统更新，请刷新页面',
            buttonText: '刷新',
            dismissButtonText: '忽略',
          },
        }),
      ],
    },
    markdown: {
      // 显示行号
      lineNumbers: true,
      // 使用主题
      theme: 'material-theme-palenight',
      // md 配置
      config: (md) => {
        // 大图预览插件
        md.use(MdCustomAttrPugin, 'image', {
          'data-fancybox': 'gallery',
        })
      },
    },
    lang: 'zh-CN',
    title: '微信小程序',
    titleTemplate: '基础+项目实战',
    description: '原生微信小程序项目实战',
    base: '/FIRST-SELF-BOLG/',
    head: [
      [
        'link',
        {
          rel: 'icon',
          href: '/jpg.ico',
        },
      ],
      // 大图预览插件资源
      [
        'link',
        { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/@fancyapps/ui/dist/fancybox.css' },
      ],
      ['script', { src: 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@4.0/dist/fancybox.umd.js' }],
    ],
    lastUpdated: true,
    themeConfig: {
      logo: '/logo.jpg',
      siteTitle: '个人博客',
      returnToTopLabel: '返回顶部',
      search: {
        provider: 'local',
        options: {
          translations: {
            button: {
              buttonText: '搜索文档',
              buttonAriaLabel: '搜索文档',
            },
            modal: {
              displayDetails: '展开详情',
              noResultsText: '无法找到相关结果',
              resetButtonTitle: '清除查询条件',
              footer: {
                selectText: '选择',
                navigateText: '切换',
              },
            },
          },
        },
      },
      outline: {
        label: '目录',
        level: 'deep',
      },
      docFooter: {
        prev: '上一篇',
        next: '下一篇',
      },
      footer: {
        message: '根据 MIT 许可证发布',
        copyright: `Copyright © ${new Date().getFullYear()} HAIBO`,
      },
      // https://vitepress.dev/reference/default-theme-config
      editLink: {
        pattern: 'https://github.com/Gilespeace/first-sllf-blog/issues',
        text: '帮我修改',
      },
      lastUpdatedText: '最近更新',
      nav: [
        { text: '🚙 面试题分享', link: '/mini-app/' },
        { text: '🥇一些知识点的总结', link: '/enjoy-plus/' },
        { text: '🥈工作中遇到的问题', link: '/wisdom-shop/' },
      ],

      sidebar: {
        '/QuestionBank/': [
          {
            text: '🚙 面试题分享',
            items: [
              { text: '前言', link: '/mini-app/' },
              { text: '基础第一天', link: '/mini-app/day01' },
              { text: '基础第二天', link: '/mini-app/day02' },
              { text: '基础第三天', link: '/mini-app/day03' },
            ],
          },
        ],
        '/enjoy-plus/': [
          {
            text: '享+生活',
            items: [
              { text: '前言', link: '/enjoy-plus/' },
              {
                text: '享+生活接口文档',
                link: 'https://www.apifox.cn/apidoc/shared-8d66c345-7a9a-4844-9a5a-1201852f6faa',
              },
              { text: '享+生活第一天', link: '/enjoy-plus/day01' },
              { text: '享+生活第二天', link: '/enjoy-plus/day02' },
              { text: '享+生活第三天', link: '/enjoy-plus/day03' },
              { text: '享+生活第四天', link: '/enjoy-plus/day04' },
              { text: '面试题-小程序基础', link: '/enjoy-plus/interview-base' },
              { text: '面试题-享+生活项目', link: '/enjoy-plus/interview-enjoy-plus' },
            ],
          },
        ],
        '/wisdom-shop/': [
          {
            text: '智慧商城项目',
            items: [
              { text: '前言', link: '/wisdom-shop/' },
              {
                text: '智慧商城接口文档',
                link: 'https://apifox.com/apidoc/shared-dead2bca-2509-43dc-a4de-ede5218058a1',
              },
              { text: '1.开发流程', link: '/wisdom-shop/process' },
              { text: '2.项目配置', link: '/wisdom-shop/config' },
              { text: '3.首页模块', link: '/wisdom-shop/home' },
              { text: '4.分类模块', link: '/wisdom-shop/category' },
              { text: '5.详情模块', link: '/wisdom-shop/goods' },
              { text: '6.登录模块', link: '/wisdom-shop/login' },
              { text: '7.购物车模块', link: '/wisdom-shop/cart' },
              { text: '8.用户模块', link: '/wisdom-shop/my' },
              { text: '9.订单模块', link: '/wisdom-shop/order' },
              { text: 'Git 常用命令', link: '/wisdom-shop/git' },
              { text: 'PingCode 管理平台', link: '/wisdom-shop/pingcode' },
              { text: '🚨 常见问题', link: '/wisdom-shop/question' },
            ],
          },
        ],
      },
      socialLinks: [{ icon: 'github', link: 'https://github.com/Gilespeace/first-sllf-blog' }],
    },
    // pwa 配置
    pwa: {
      outDir: '.vitepress/dist', // 输出目录
      registerType: 'autoUpdate', // 注册类型为自动更新
      manifest: {
        id: 'FIRST-SELF-BOLG', // 清单 ID
        name: 'FIRST-SELF-BOLG', // 应用名称
        short_name: 'FIRST-SELF-BOLG', // 应用的短名称
        description: 'FIRST-SELF-BOLG', // 应用的描述
        theme_color: '#ffffff', // 主题颜色
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/.jpg', // 图标路径
            sizes: '192x192', // 图标尺寸
            type: 'image/jpg', // 图标类型
          },
          {
            src: '/.jpg',
            sizes: '192x192',
            type: 'image/jpg',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{css,js,html,svg,png,ico,txt,woff2}'], // 匹配需要缓存的文件类型
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i, // 匹配需要缓存的 jsdelivr 资源
            handler: 'NetworkFirst', // 网络优先策略
            options: {
              cacheName: 'jsdelivr-cache', // 缓存名称
              expiration: {
                maxEntries: 10, // 最大缓存条目数
                maxAgeSeconds: 60 * 60 * 24 * 7, // 缓存有效期，7天
              },
              cacheableResponse: {
                statuses: [0, 200], // 缓存的响应状态码
              },
            },
          },
        ],
      },
    },
  }),
)
