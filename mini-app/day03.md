# 微信小程序开发 - 第 3 天

## 一、分包加载

分包加载是优化小程序加载速度的一种手段。

### 1.1 为什么？

- 微信平台对小程序单个包的代码体积限制为 2M，超过 2M 的情况下可以采用分包来解决
- 即使小程序代码体积没有超过 2M 时也可以拆分成多个包来实现按需加载
- 配置文件能忽略的只有静态资源，代码无法被忽略

### 1.2 使用分包

在全局配置中使用 `subPackages` 来配置分包的根目录和分包中的页面路径：

```json
{
  "subPackages": [
    {
      "root": "subpkg_test",
      "pages": ["pages/test/index"]
    },
    {
      "root": "subpkg_user",
      "pages": ["pages/profile/index"]
    }
  ]
}
```

- `root` 指定分包的根目录
- `pages` 指定分包中的页面路径

注：根目录和路径不存在时，小程序开发者工具会自动创建。

### 1.3 分包预加载

在实际使用分包的过程中，纯粹的按需加载也不是最优的方案，可以将即将访问的页面的包预先下载下来，这样能进一步提升小程序加载的速度，通过 `preloadRule` 来配置预加载的包：

```json
{
  "preloadRule": {
    "pages/framework/index": {
      "network": "all",
      "packages": ["subpkg_user"]
    }
  }
}
```

上述代码的含义是在加载 `pages/framework/index` 页面时，自动的去加载 `subpkg_user` 这个分包，等到要访问这个分包中的页面时会直接打开。

## 二、自定义组件

小程序中内置了许多的组件供开发者使用，不仅如此开发者还可根据需要自定义组件。

### 2.1 基本语法

- 创建自定义组件

  通过小程序开发者工具可以快速创建组件，具体操作见课堂演示。

  创建好的自定义组件从结构上看与页面是完全一致的，由 `.wxml`、`.wxss`、`.js`、`.json` 构成，也有两点重要的区别：

  - `.json` 文件中必须有 `component: true`
  - `.js` 文件中调用的是 `Component` 函数

- 使用组件

  组件需要在页面或全局中注册后才可以使用，注册组件会用到配置项 `usingComponents` ，它的值是对象类型数据，属性名为自定义组件的名称，属性的值为自定义组件的路径

  ```json
  {
    "usingComponents": {
      "自定义组件名称": "自定义组件的路径",
      "navbar": "./navigation-bar/index"
    }
  }
  ```

### 2.2 组件样式

在开发中经常会需要修改自定义组件内部的样式，有两种方式可以实现这个目的。

- 样式隔离：默认情况下页面的样式无法影响自定义组件的样式
  - `addGlobalClass: true` 允许在页面中修改自定义组件的样式，但要求必须使用组件本身的类名
  - 在组件中定义样式时使用的选择器不能是标签选择器、ID 选择器或属性选择器
- 外部样式类：

  - `externalClasses: ['xxx-class', 'yyy-class']` 开发自定义的样式类
  - `xxx-class` 和 `yyy-class` 可以接收外部传入的类名，并应用到组件的布局结构中

  ```javascript
  Component({
    options: {
      addGlobalClass: true,
    },
    // 开发自定义的样式类
    externalClasses: ['custom-class', 'title-class'],
  })
  ```

  ```xml
  <navbar
    custom-class="my-navigation-bar"
    title-class="my-navigation-bar-title"
  ></navbar>
  ```

  ```xml
  <view class="navigation-bar custom-class">
    <view class="navigation-bar-title title-class">
      自定义标题
    </view>
  </view>
  ```

### 2.3 slot（插槽）

小程序中默认只能使用一个 `slot` 需要多个插槽时需要传入 `options: { multipleSlots: true }`。

- 创建插槽：在组件的任意位置使用 `<slot />` 进行占位

  - 默认只能使用 1 个 `<slot>`
  - `options: { multipleSlots: true }` 启用多插槽
  - `name` 为不同的 `<slot />` 命名来区分不同的插槽

- 使用插槽
  - 单个插槽的情况下直接在组件中间填充内容即可
  - 多外插槽的情况下需要使用 `slot` 属性来指定插槽位置

### 2.4 组件生命周期

小程序自定义组件的生命周期需要定义在 `lifetimes` 中：

```javascript
Component({
  lifetimes: {
    created() {
      // code...
    },
    attached() {
      // code...
    },
  },
})
```

- `created` 组件创建时触发，类似于 Vue 中的 `created` 生命周期，该生命周期中不能调用 `this.setData`

- `attached` 组件初始化完毕时触发，类似于 Vue 中的 `mounted` 生命周期，该生命周期函数使用最频繁

### 2.5 组件通信

组件通信是指将页面或组件的数据传入子组件内部或者将子组件的数据传入父组件或页面当中。

**自定义属性：**

组件通过自定义的属性接收来自于组件外部（父组件或页面）的数据：

```js
Component({
  properties: {
    back: Boolean,
    delta: {
      type: Number,
      value: 1,
    },
  },
})
```

```xml
<navbar back delta="1">
  <text slot="title">自定义标题</text>
</navbar>
```

本节示例用到的样式代码：

```css
.navigation-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 44px;
  background-color: #fff;
}

.back {
  position: absolute;
  left: 10px;
  width: 44rpx;
  height: 44rpx;
  background-image: url(https://lotjol.github.io/static-store/enjoy-plus/images/back-arrow.svg);
  background-repeat: no-repeat;
}
```

**自定义事件：**

组件自定义事件的监听：`bind:事件类型（自定义）="事件回调"`

组件自定义事件的触发：`this.triggerEvent('事件类型（自定义）', 参数)`

本节示例用到的样式代码：

```jsx
// components/navbar/navbar.wxml
<button size="mini" type="primary" bind:tap="onClick">内部按钮</button>

// components/navbar/navbar.js
Component({
  // 组件<内部>的数据
  data: {
    // 顶部状态栏高度
    top: 0
  },
  // 组件的事件需要写在 methods 结构中
  methods: {
    onClick() {
      this.triggerEvent('get-top', this.data.top)
    }
  }
})


// pages/component/index.wxml
<my-nav back="{{ false }}" bind:get-top="getNavTop">
  自定义导航栏
</my-nav>

// pages/component/index.js
Page({
  // 页面通过 事件回调函数，获取组件传递的数据
  getNavTop(ev) {
    wx.showToast({
      title: '状态栏高度为' + ev.detail,
    })
  }
})
```

### 2.6 Vant 组件库

Vant 组件库有 Vue 和小程序两个版本，在使用时要注意区分！

[Vant 组件库小程序版](https://vant-contrib.gitee.io/vant-weapp/#/home)

1. npm 初始化

```bash
npm init
```

2. 安装，在小程序的根目录中安装

```bash
npm install @vant/weapp
```

3. 修改 `app.json`，移除全局配置 `"style": "v2"`，否则 Vant 组件的样式会受到影响

4. 修改 `project.config.json`，配置 `"setting"` 选项中的 `packNpmManually` 和 `packNpmRelationList`

5. 构建 npm，小程序中凡是通过 npm 下载的模块，都必须经过构建才能使用，构建后的代码会存放在 **miniprogram_npm** 中。

Vant 组件库使用步骤请见 [官方文档 - 快速上手](https://vant-contrib.gitee.io/vant-weapp/#/quickstart)

## 三、框架接口

### 3.1 昵称和头像

- 用户昵称

  - `input` 组件的 `type` 属性设置为 `nickname`
  - 监听 `input` 组件的 `blur` 事件（在开发者工具中需要失去焦点两次）
  - 事件回调中通过事件对象 `ev.detail` 获取用户昵称

- 用户头像
  - `button` 组件的 `open-type` 属性设置为 `chooseAvatar`
  - 监听 `button` 组件的 `chooseavatar` 事件（没有大写字母）
  - 事件回调中通过事件对象 `ev.detail.avatarUrl`

本节示例用到的代码：

```xml
<view class="profile">
  <view class="nickname">
    <label for="">昵称:</label>
    <input type="text" />
  </view>
  <view class="avatar">
    <label for="">头像:</label>
    <button>
      <image src="" mode="aspectFill"/>
    </button>
  </view>
</view>
```

```css
.profile {
  min-height: 300rpx;
  padding: 30rpx;
  border-radius: 10rpx;
  background-color: #fff;
}
.nickname,
.avatar {
  display: flex;
  align-items: center;
  height: 80rpx;
  padding: 0 10rpx;
  border-bottom: 1rpx solid #eee;
}
.nickname label,
.avatar label {
  margin-right: 20rpx;
}
.nickname input {
  flex: 1;
  border: none;
  text-align: right;
}
.avatar button {
  flex: 1;
  height: 60rpx;
  padding: 0 20rpx;
  text-align: right;
  background-color: transparent;
}
.avatar image {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  vertical-align: baseline;
  background-image: url(https://lotjol.github.io/static-store/enjoy-plus/images/user_placeholder.png);
  background-size: cover;
}
```

### 3.2 应用实例

在 `app.js` 中调用 App 时会注册应用实例，这个实例具有全局唯一性，通过调用 `getApp` 函数来获取。

在应用实例中可以添加一些需要共享的数据或方法：

```javascript
App({
  message: '应用实例中的数据...',
  updateMessage() {
    // this 指向应用实例本身
  },
})
```

```javascript
// 获取用应实例
const app = getApp()
Page({
  onLoad() {
    // 查看应用实例中的内容
    console.log(app)
  },
})
```

### 3.3 页面栈

页面栈本质上是一个数组，它记录着当前打开的全部页面历史，页面栈中的每个单元即为一个页面实例（调用 Page 函数时会注册页面实例）。

全局调用 `getCurrentPages` 函数可以获取当前的页面栈，通过页面栈可以看到所有的页面实例，借助于页面栈可以获取到页面中的一些有用信息：

- `data` 页面的初始数据
- `setData` 更新数据
- `onShow`、`onLoad` 等生命周期
- `route` 页面的路径
- 后续开发中还有其它...
