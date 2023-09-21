# 享+生活 - 第 2 天

## 一、refresh_token

记录用户登录状态的 `token` 的有效时间被设置成了 8 个小时，超过 8 小时后将不再保持登录的状态了，此种情况下除了让用户重新进行登录外还有一种体验更好的方式，即 refresh_token。

在调用登录接口成功后会返回 `token` 和 `refreshToken` 当 `token` 有效时间设置了 8 个小时，`refreshToken` 有效时间设置了 3 天，当 `token` 失效后 `refreshToken` 仍然有效，此时可以通过 `refreshToken` 来为 `token` 续期，所谓的续期就是调用后端提供的一个接口，然后把 `refreshToken` 发送给服务端，服务端重新返回新的 `token` 和 `refreshToken`。

### 1.1 刷新 token

1. 判断当前的 `token` 有没有失效可以根据接口返回的状态码进行判断，当 `token` 失效后会返回 `401`，在响应拦截器中可以统一获取所有接口返回的状态码，然后对其进行判断：

   ```javascript
   // utils/http.js
   // 配置响应拦截器
   http.intercept.response = async function ({ data, config }) {
     // 如果状态码为401，则表明token已失效
     if (data.code === 401) {
       // 获取应用实例来读取 refreshToken
       const app = getApp()
       console.log(app.refreshToken)
     }
     // 只保留data数据，其它的都过滤掉
     return data
   }
   ```

   要想通过应用实例 getApp 来读取 `refreshToken` 必须提前读取本地存储的数据并存储到应用实例当中：

   ```javascript
   // app.js
   App({
     onLaunch() {
       // 读取 token
       this.getToken()
     },
     getToken() {
       // 读取本地的token
       this.token = wx.getStorageSync('token')
       this.refreshToken = wx.getStorageSync('refreshToken')
     },
   })
   ```

2. 调用接口把 `refreshToken` 发送给服务端换取新的 `token` 和 `refreshToken`

   [接口文档地址](https://apifox.com/apidoc/shared-8d66c345-7a9a-4844-9a5a-1201852f6faa/api-44946311)

   接口中所需要的接口 `refreshToken` 需要通过自定义的头信息 `Authorization` 来传递：

   ```javascript
   // utils/http.js
   // 配置响应拦截器
   http.intercept.response = async function ({ data, config }) {
     // 如果状态码为401，则表明token已失效
     if (data.code === 401) {
       // 获取应用实例
       const app = getApp()
       // 1.1 调用接口获取新的 token
       const res = await http({
         url: '/refreshToken',
         method: 'POST',
         header: {
           Authorization: 'Bearer ' + app.refreshToken,
         },
       })
       // 检测接口是否调用成功
       if (res.code !== 10000) return wx.utils.toast('更新token失败!')
       // 重新存储新的 token
       app.setToken('token', res.data.token)
       app.setToken('refreshToken', res.data.refreshToken)
     }
     // 只保留data数据，其它的都过滤掉
     return data
   }
   ```

   在获取新的 `token` 和 `refreshToken` 后需要将原来已经失效的 `token` 和 `refreshToken` 替换掉，即再次调用 `app.setToken` 来更新数据。

### 1.2 无感请求

在实际的应用中在调用某个接口时才会知道 `token` 是否已经过期，这种情况我们去刷新了 `token` ，但是原接口调用的数据我们并不能立刻获取到，为了解决这个问题我们可以在刷新 `token` 成功后，自动的再去把原来的接口调用一次来获取数据，对于用户来说感觉不到 `token` 曾以失效过，我们将这种处理方式叫成了无感请求（这是我自已起的名字，大家重点理解这个名称背后的实现逻辑即可）。

```javascript
// 配置响应拦截器
http.intercept.response = async function ({ data, config }) {
  // 如果状态码为401，则表明token已失效
  if (data.code === 401) {
    // 获取应用实例
    const app = getApp()
    // 1.1 调用接口获取新的 token
    const res = await http({
      url: '/refreshToken',
      method: 'POST',
      header: {
        Authorization: 'Bearer ' + app.refreshToken,
      },
    })
    // 检测接口是否调用成功
    if (res.code !== 10000) return wx.utils.toast('更新token失败!')
    // 重新存储新的 token
    app.setToken('token', res.data.token)
    app.setToken('refreshToken', res.data.refreshToken)

    // 1.2 获取到原来接口请求的参数
    config = Object.assign(config, {
      header: {
        // 更新后的 token
        Authorization: 'Bearer ' + res.data.token,
      },
    })
    // 重新发请求
    return http(config)
  }
  // 只保留data数据，其它的都过滤掉
  return data
}
```

重新发起请求时 `config` 中包含的是旧的失效的 `token`，我们需要用新的 `token` 覆盖掉原有请求参数中的自定义头信息 `Authorization` ：

```javascript
// 获取到原来接口请求的参数
config = Object.assign(config, {
  header: {
    // 更新后的 token
    Authorization: 'Bearer ' + res.data.token,
  },
})
```

### 1.3 重新登录

刷新 `token` 完成后我们需要进一步的分析，如果 `refreshToken` 也失效了怎么办？（用户超过 3 天都没有打开过小程序的情况下），这种情况下就只能让用户重新进行登录了，即跳转到登录页面即可：

```javascript
// 配置响应拦截器
http.intercept.response = async function ({ data, config }) {
  // 如果状态码为401，则表明token已失效
  if (data.code === 401) {
    // 获取应用实例
    const app = getApp()
    // 1.3 状态为 401 且接口为 /refreshToken 表明 refreshToken 也过期了
    if (config.url.includes('/refreshToken')) {
      // 获取当前页面的路径，保证登录成功后能跳回到原来页面
      const pageStack = getCurrentPages()
      const currentPage = pageStack.pop()
      const redirectURL = currentPage.route
      // 跳由跳转（登录页面）
      return wx.redirectTo({
        url: '/pages/login/index?redirectURL=/' + redirectURL,
      })
    }
    // 1.1 调用接口获取新的 token
    const res = await http({
      url: '/refreshToken',
      method: 'POST',
      header: {
        Authorization: 'Bearer ' + app.refreshToken,
      },
    })
    // 检测接口是否调用成功
    if (res.code !== 10000) return wx.utils.toast('更新token失败!')
    // 重新存储新的 token
    app.setToken('token', res.data.token)
    app.setToken('refreshToken', res.data.refreshToken)

    // 1.2 获取到原来接口请求的参数
    config = Object.assign(config, {
      header: {
        // 更新后的 token
        Authorization: 'Bearer ' + res.data.token,
      },
    })
    // 重新发请求
    return http(config)
  }
  // 只保留data数据，其它的都过滤掉
  return data
}
```

在响应拦截器中通过 `config` 参数可以获取调用接口的路径参数，判断如果调用的是 `/refreshToken` 接口且返回的是 401 时，则表过是 `refreshToken` 当前也是过期了。

## 二、房屋管理

房屋管理是项目中最大的功能模块，其它包含了位置服务、房屋信息、房屋列表、添加房屋、修改房屋、删除房屋等子功能。

### 2.1 位置服务

位置服务（LBS）是基于用户的位置来提供服务的技术，通过要配合第三方的服务来实现，如腾讯地图、高德地图、百度地图等，在本项目采用的是[腾讯的位置服务](https://lbs.qq.com/)。

申请使用腾讯位置服务需要按如下步骤操作：

1. 注册账号
2. 创建应用
3. 生成 key
4. 小程序管理后台添加合法域名

步骤参考视频的介绍和官方文档来操作，在此就不缀述了。

在使用位置服务的时候需要提供用户的位置（经纬度），关于用户的位置小程序提供了 API ，在使用获取位置的 API 时需要先在 `app.json` 中进行声明，并在小程序管理后进行申请，相关限制请参考[文档说明](https://developers.weixin.qq.com/community/develop/doc/000a02f2c5026891650e7f40351c01)。

```json
{
  "requiredPrivateInfos": [
    "getLocation",
    "chooseLocation"
  ],
  "permission": {
    "scope.userLocation": {
      "desc": "你的位置信息将用于小程序位置接口的效果展示"
   }
}
```

调用 `wx.getLocation()` 获取用户当前位置，该 API 支持返回 Promise：

```javascript
Page({
  async getLocation() {
    // 调用 API
    const { latitude, longitude } = await wx.getLocation()
    console.log(latitude, longitude)
  },
})
```

调用 `wx.chooseLocation` 会打开地图由用户自由选择一个位置后返回该位置的经纬度，该 API 支持返回 Promise：

```javascript
Page({
  async chooseLocation() {
    // 调用小程序 API 获取新的位置
    const { latitude, longitude } = await wx.chooseLocation()
    console.log(latitude, longitude)
  },
})
```

准备工作都完成了，接下来可以到项目中使用腾讯位置服务提供的功能了：

1. 导入位置服务微信小程序 [Javascript SDK](https://mapapi.qq.com/web/miniprogram/JSSDK/qqmap-wx-jssdk1.2.zip)，它是官方封装好的一个 `.js` 文件

   ```javascript
   // utils/qqmap.js
   // 导入腾讯位置服务 SDK
   import QQMapWX from '../libs/qqmap-wx-jssdk'
   // 实例化位置服务（使用个人申请的 key）
   export default new QQMapWX({
     key: '填写自已的 KEY',
   })
   ```

2. 调用 SDK 提供的方法 `search` 实现[搜索周边小区](https://lbs.qq.com/miniProgram/jsSdk/jsSdkGuide/methodSearch)的功能

   ```javascript
   // 导入腾讯位置服务
   import QQMap from '../../../utils/qqmap'

   Page({
     onLoad() {
       // 获取用户经纬度
       this.getLocation()
     },
     async getLoaction() {
       // 调用小和序 API 获取用户位置
       const { latitude, longitude } = await wx.getLocation()
       // 获取周边小区
       this.getPoint(latitude, longitude)
     },
     getPoint(latitude, longitude) {
       // search 是实现地点搜索功能的方法
       QQMap.search({
         keyword: '住宅小区', //搜索关键词
         location: [latitude, longitude].join(','), //设置周边搜索中心点
         page_size: 5,
         success: (result) => {
           // 过滤掉多余的数据
           const points = result.data.map(({ id, title, _distance }) => {
             return { id, title, _distance }
           })
           // 渲染数据
           this.setData({ points })
         },
       })
     },
   })
   ```

   将获取的小区信息渲染到页面上：

   ```xml
   <!-- 检测用户登录状态 -->
   <authorization>
     <view class="locate">
       <van-cell-group border="{{false}}" title="当前地点">
         ...
       </van-cell-group>
       <van-cell-group border="{{false}}" title="附近社区">
         <van-cell
           wx:for="{{points}}"
           wx:key="id"
           title="{{item.title}}"
           link-type="navigateTo"
           url="/house_pkg/pages/building/index"
           is-link
         />
       </van-cell-group>
     </view>
   </authorization>

   ```

3. 调用 SDK 提供的方法 `reverseGeocoder` 实现[逆地址解析](https://lbs.qq.com/miniProgram/jsSdk/jsSdkGuide/methodReverseGeocoder)的功能，逆地址解析是指根据经纬度来获取具体的地址信息。

   ```javascript
   // 导入腾讯位置服务
   import QQMap from '../../../utils/qqmap'
   Page({
     // ...
     getPoint(latitude, longitude) {
       // 逆地址解析（根据经纬度来获取地址）
       QQMap.reverseGeocoder({
         location: [latitude, longitude].join(','),
         success: ({ result: { address } }) => {
           // 数据数据
           this.setData({ address })
         },
       })

       // search 是实现地点搜索功能的方法
       QQMap.search({
         keyword: '住宅小区', //搜索关键词
         location: [latitude, longitude].join(','), //设置周边搜索中心点
         page_size: 5,
         success: (result) => {
           // 过滤掉多余的数据
           const points = result.data.map(({ id, title, _distance }) => {
             return { id, title, _distance }
           })
           // 渲染数据
           this.setData({ points })
         },
       })
     },
   })
   ```

4. 调用 `wx.chooseLocation` 重新选择位置

   ```javascript
   // 导入腾讯位置服务
   import QQMap from '../../../utils/qqmap'
   Page({
     // ...
   	chooseLocation() {
       // 调用小程序 API 获取新的位置
       const { latitude, longitude } = await wx.chooseLocation()
       // 获取新的位置附近的小区
       this.getPoint(latitude, longitude)
     },
     getPoint(latitude, longitude) {
       // ...
     }
   })
   ```

### 2.2 房屋信息

完整的房屋信息由 3 个组成部分：小区名称、楼栋号、房间号，在企真实的开发中这 3 个部分需要后端提供接口来

分别获取，但是由于这部分的数据量特别大（要整理全国的小区数据），后端很难短时间处理完成，所以暂时没有提供接口，我们不得不临时随机生成一些数据先把功能实现。

1. 小区名称通过位置服务已经获取到，将小区名称拼凑到 URL 地址上，然后再随机生成一些楼栋信息：

   ```javascript
   // house_pkg/pages/building/index.js
   Page({
     data: {
       size: 0,
       point: '',
       type: '',
     },
     // 获取地址参数
     onLoad({ point }) {
       // 生成假数据
       this.fake(point)
     },
     fake(point) {
       // 生成楼栋数（用于上课）
       const size = Math.floor(Math.random() * 4) + 3
       // 楼栋名称（xx小区 / xx栋）
       const type = size > 4 ? '号楼' : '栋'
       // 数据渲染
       this.setData({ size, type, point })
     },
   })
   ```

   上述代码中生成的假数据并没有特别的设计，只是利用了一下随机函数，大家能看懂逻辑即可，因此它是非正式的代码，真正的开发过程中需要调用接口来获取数据。

   将生成的楼栋信息渲染到页面当中：

   ```xml
   <view class="building">
     <van-cell-group border="{{false}}">
       <van-cell
         wx:for="{{size}}"
         wx:key="*this"
         title="{{point}}{{item + 1}}{{type}}"
         link-type="navigateTo"
         url="/house_pkg/pages/room/index"
         is-link
       />
     </van-cell-group>
   </view>

   ```

2. 房间号的信息也里利用随机函数生成的假数据

   ```javascript
   // house_pkg/pages/room/index.js
   Page({
     data: {
       point: '',
       building: '',
       rooms: [],
     },
     onLoad({ point, building }) {
       // 创建房间
       this.fake(point, building)
     },
     fake(point, building) {
       // 生成多少个房间
       const size = Math.floor(Math.random() * 5) + 4
       const rooms = []
       for (let i = 0; i < size; i++) {
         // 楼层号生成 1 ~ 20
         const floor = Math.floor(Math.random() * 19) + 1
         // 具体的房间号生成 1 ~ 3
         const No = Math.floor(Math.random() * 2) + 1
         const room = [floor, 0, No].join('')
         // 检测是否有重复的房间号
         if (rooms.includes(room)) return
         // 记录生成完整的房间号
         rooms.push(room)
       }
       // 渲染数据
       this.setData({ rooms, point, building })
     },
   })
   ```

   将生成的房间号信息渲染到页面当中：

   ```xml
   <view class="room">
     <van-cell-group border="{{false}}">
       <van-cell
         wx:for="{{rooms}}"
         wx:key="*this"
         title="{{point}}{{building}} {{item}}"
         link-type="navigateTo"
         url="/house_pkg/pages/form/index"
         is-link
       />
     </van-cell-group>
   </view>

   ```

   到此房屋信息的数据就处理完毕了，接下来再补充业主的信息即可完成房屋添加的功能了。

### 2.3 添加房屋

本小节主要是处理表单的数据，包括获取数据、验证数据、图片上传等具体的功能逻辑。

用户处理未登录状态情况下不允许添加新房屋，因此需要检测用户的登录状态，在此基础上还需要对检测登录的组件 `authorization` 进行优化，在未登录的情况下不允许页面中有任何请求发出，通常页面的首次请求是在 `onLoad` 或者 `onShow` 生命周期发出的，因此在登录的情况下重写 `onLoad` 和 `onShow` 生命周期即可：

```javascript
// /components/authorization/index.js
Component({
  // ...
  lifetimes: {
    attached() {
      // 获取登录状态
      const isLogin = !!getApp().token
      // 变更登录状态
      this.setData({ isLogin })
      // 获取页面栈
      const pageStack = getCurrentPages()
      // 获取页面路径
      const currentPage = pageStack.pop()
      // 未登录的情况下跳转到登录页面
      if (!isLogin) {
        // 使用空白函数覆盖原生的生命周期 onLoad onShow
        currentPage.onLoad = () => {}
        currentPage.onShow = () => {}
        wx.redirectTo({
          url: '/pages/login/index?redirectURL=/' + currentPage.route,
        })
      }
    },
  },
})
```

1. 获取表单数据，房屋信息通地址参数来获取，业主姓名、业主性别、业主手机号通过 `model:value` 来获取

   ```javascript
   // house_pkg/pages/form/index.js
   Page({
     onLoad({ point, building, room }) {
       // 获取房屋信息数据
       this.setData({ point, building, room })
     },
   })
   ```

   用户身份证照片的上传会用到 `wx.chooseMedia` 这个 API 让用户来打开相册或拍照选择一张照片后再调用 `wx.uploadFile` 实现图片的上传，上传图片这部分逻辑与之前上传用户头像是一样的，调用的接口也一样。

   `wx.chooseMedia` 的基本用法：

   - `count` 允许 1 次选择几张图片
   - `mediaType` 允许选择文件的类型，图片或视频
   - `compressed` 图片或视频是否压缩
   - 支持返回 Promise

   ```javascript
   // house_pkg/pages/form/index.js
   Page({
     onLoad({ point, building, room }) {
       // 获取房屋信息数据
       this.setData({ point, building, room })
     },
     async uploadPicture() {
       // 打开相册或拍照
       const media = await wx.chooseMedia({
         count: 1,
         mediaType: ['image'],
         sizeType: ['compressed'],
       })
     },
   })
   ```

   在获取到一张图片后调用 `wx.uploadFile` 将图片上传到服务器：

   ```javascript
   // house_pkg/pages/form/index.js
   Page({
     onLoad({ point, building, room }) {
       // 获取房屋信息数据
       this.setData({ point, building, room })
     },
     // 上传身份证照片
     async uploadPicture(ev) {
       // 区分用户上传的是正面或反面
       const type = ev.mark.type

       try {
         // 打开相册或拍照
         const media = await wx.chooseMedia({
           count: 1,
           mediaType: ['image'],
           sizeType: ['compressed'],
         })

         // 调用 API 上传图片
         wx.uploadFile({
           url: wx.http.baseURL + '/upload',
           filePath: media.tempFiles[0].tempFilePath,
           name: 'file',
           header: {
             Authorization: 'Bearer ' + getApp().token,
           },
           success: (result) => {
             // 处理返回的 json 数据
             const data = JSON.parse(result.data)
             // 判断接口是否调用成功
             if (data.code !== 10000) return wx.utils.toast('上传图片失败!')
             // 渲染数据
             this.setData({ [type]: data.data.url })
           },
         })
       } catch (err) {
         // 获取图片失败
         console.log(err)
       }
     },
   })
   ```

   上述的代码中通过 ` ev.mark.type` 来区分用户上传的是身份证的正确还是反面。

2. 获取了全部的表单数据后再对数据进行验证，房屋的信息是通过地址获取的不需要验证码，性别可以指定默认值也不需要验证码，剩下的数据通过 `wechat-validate` 插件进行验证：

   ```javascript
   // house_pkg/pages/form/index.js
   // 导入表单验证插件
   import wxValidate from 'wechat-validate'
   Page({
     behaviors: [wxValidate],
     data: {
       point: '',
       building: '',
       room: '',
       name: '',
       gender: 1,
       mobile: '',
       idcardFrontUrl: '',
       idcardBackUrl: '',
     },
     rules: {
       name: [
         { required: true, message: '业主姓名不能为空!' },
         { pattern: /^[\u4e00-\u9fa5]{2,5}$/, message: '业主姓名只能为中文!' },
       ],
       mobile: [
         { required: true, message: '业主手机号不能为空!' },
         { pattern: /^1[3-8]\d{9}$/, message: '请填写正确的手机号!' },
       ],
       idcardFrontUrl: [{ required: true, message: '请上传身份证国徽面!' }],
       idcardBackUrl: [{ required: true, message: '请上传身份证照片面!' }],
     },
   })
   ```

3. 调用接口提交表单的全部数据

   [接口文档地址](https://apifox.com/apidoc/shared-8d66c345-7a9a-4844-9a5a-1201852f6faa/api-41400753)

   参考示例代码如下所示：

   ```javascript
   // house_pkg/pages/form/index.js
   // 导入表单验证插件
   import wxValidate from 'wechat-validate'
   Page({
     behaviors: [wxValidate],
     data: {
       // ...
     },
     rules: {
       // ...
     },
     // 提交审核
     async submitForm() {
       // 验证数据
       if (!this.validate()) return
       // 获取全部的数据（剔除可能多余参数 __webviewId__）
       const { __webviewId__, status, ...data } = this.data
       // 调用接口
       const { code } = await wx.http.post('/room', data)
       // 检测接口是否调用成功
       if (code !== 10000) return wx.utils.toast('提交数据失败!')
       // 返回房屋列表页面
       wx.navigateBack({ delta: 4 })
     },
   })
   ```

   在成功添加新房屋后返回到房屋列表页面，调用的是小程序的 API `wx.navigateBack()` 其中参数 `delta` 的含义是返回几步。

### 2.4 房屋列表

成功添加房屋后在房屋列表页面中查询所有的房屋数据，要求用户必须是登录的状态。

[接口文档地址](https://apifox.com/apidoc/shared-8d66c345-7a9a-4844-9a5a-1201852f6faa/api-41400750)

参考示例代码如下：

```javascript
Page({
  data: {
    houseList: [],
    isEmpty: false,
    dialogVisible: false,
  },
  onShow() {
    // 获取用房屋列表
    this.getHouseList()
  },
  // 用户房屋列表
  async getHouseList() {
    // 调用接口
    const { code, data: houseList } = await wx.http.get('/room')
    // 检测接口是否调用成功
    if (code !== 10000) return wx.utils.toast()
    // 渲染数据
    this.setData({
      houseList,
      isEmpty: houseList.length === 0,
    })
  },
  // ...
})
```

调用接口获取房屋列表数据时要在 `onShow` 生命周期当中，因为在添加房屋成功后是通过 `wx.navigateBack` 返回来的，此时触发的是 `onShow` 生命周期。

把获取的房屋列表数据渲染出来：

```xml
<authorization>
  <block wx:if="{{!isEmpty}}">
    <scroll-view show-scrollbar="{{false}}" enhanced scroll-y>
      <view class="houses">
        <view class="houses-title">房屋信息</view>
        <view class="houses-list">
          <van-swipe-cell
            wx:for="{{houseList}}"
            wx:key="id"
            mark:index="{{index}}"
            mark:id="{{item.id}}"
            async-close
            bind:close="swipeClose"
            right-width="{{70}}"
          >
            <van-cell-group mark:id="{{item.id}}" bind:tap="goDetail" border="{{false}}">
              <van-cell size="large" title="{{item.point}}">
                <text wx:if="{{item.status === 1}}" class="tag info">正在审核</text>
                <text wx:if="{{item.status === 2}}" class="tag success">审核通过</text>
                <text wx:if="{{item.status === 3}}" class="tag fail">审核失败</text>
              </van-cell>
              <van-cell
                title="房间号"
                border="{{false}}"
                value="{{item.building}}{{item.room}}"
              />
              <van-cell title="业主" border="{{false}}" value="{{item.name}}" />
            </van-cell-group>
            <view slot="right">删除</view>
          </van-swipe-cell>
        </view>
      </view>
    </scroll-view>
    <view wx:if="{{houseList.length < 5}}" class="toolbar" bind:tap="addHouse">
      <text class="enjoy-icon icon-add"></text>
      <text class="button-text">添加新房屋</text>
    </view>
  </block>
  <view wx:else class="blank">
    您还没有认证房屋，请点击
    <navigator hover-class="none" class="link" url="/house_pkg/pages/locate/index">添加</navigator>
  </view>
</authorization>
```

在渲染数据时需要注意当列表数据为空时设置数据 `isEmpty` 的值为 `true`，然后给用户展示一段提示的内容，另外列表的数据限制最多为 5 条，当大于 5 条后就不再展示添加新房屋这个按钮了。

### 2.5 房屋详情

根据房屋 ID 调用接口获取房屋的详情并展示到页面中。

[接口文档地址](https://apifox.com/apidoc/shared-8d66c345-7a9a-4844-9a5a-1201852f6faa/api-41400751)

在从房屋列表中跳转到房屋详情时将房屋的 ID 拼凑在 URL 的后面：

```javascript
// house_pkg/pages/list/index.js
Page({
  // ...
  goDetail(ev) {
    // 通过 mark:id 来传递数据
    wx.navigateTo({
      url: '/house_pkg/pages/detail/index?id=' + ev.mark.id,
    })
  },
})
```

获取地址中携带的房屋 ID，然后调用接口：

```javascript
// house_pkg/pages/detail/index.js
Page({
  data: {
    houseDetail: {},
  },
  onLoad({ id }) {
    // 获取房屋详情
    this.getHouseDetail(id)
  },
  // 房屋详情接口
  async getHouseDetail(id) {
    if (!id) return wx.utils.toast('参数有误!')
    // 调用接口
    const { code, data: houseDetail } = await wx.http.get('/room/' + id)
    // 检测接口是否调用成功
    if (code !== 10000) return wx.utils.toast()
    // 渲染数据
    this.setData({ houseDetail })
  },
})
```

将获取的数据渲染到页面中

```xml
<scroll-view scroll-y enhanced show-scrollbar="{{false}}">
  <view class="house-detail">
    <van-cell-group border="{{false}}" title="房屋信息">
      <van-cell title="{{houseDetail.point}}">
        <text wx:if="{{houseDetail.status === 1}}" class="tag info">正在审核</text>
        <text wx:if="{{houseDetail.status === 2}}" class="tag success">审核通过</text>
        <text wx:if="{{houseDetail.status === 3}}" class="tag fail">审核失败</text>
      </van-cell>
    </van-cell-group>
    <van-cell-group title="业主信息" border="{{false}}">
      <van-cell
        title-width="200rpx"
        title="房间号"
        value="{{houseDetail.building}}{{houseDetail.room}}"
      />
      <van-cell title-width="200rpx" title="业主" value="{{houseDetail.name}}" />
      <van-cell
        title-width="200rpx"
        border="{{false}}"
        title="手机号"
        value="{{houseDetail.mobile}}"
      />
    </van-cell-group>
    <view class="id-card">
      <van-cell title="本人身份证照片" />
      <view class="id-card-front">
        <image src="{{houseDetail.idcardFrontUrl}}" />
      </view>
      <view class="id-card-back">
        <image src="{{houseDetail.idcardBackUrl}}" />
      </view>
    </view>
  </view>
</scroll-view>
<view class="toolbar" bind:tap="editHouse">
  <text class="enjoy-icon icon-edit"></text>
  <text class="button-text">修改房屋信息</text>
</view>

```

房屋有状态有 3 种：

- 1 正在审核，对应的类名为 `info`
- 2 审核通过，对应的类名为 `success`
- 3 审核 失败，对应的类名为 `fail`

### 2.6 编辑房屋

编辑房屋是对原有的房屋信息进行修改，首先要获取原来的房屋信息展示到表单中，然后将修改后的房屋信息再次调用接口发送给服务端。

获取房屋详情的[接口文档地址](https://apifox.com/apidoc/shared-8d66c345-7a9a-4844-9a5a-1201852f6faa/api-41400753)

参考示例代码如下：

```javascript
// house_pkg/pages/form/index.js
Page({
  // ...
  onLoad({ point, building, room, id }) {
    // 根据 id 判断是否为修改房屋
    if (id) return this.getHouseDetail(id)
    // 添加房屋 (渲染数据)
    this.setData({ point, building, room })
  },
  // 房屋详情接口
  async getHouseDetail(id) {
    // 调用接口
    const { code, data: houseDetail } = await wx.http.get('/room/' + id)
    // 检测接口是否调用成功
    if (code !== 10000) return wx.utils.toast()
    // 渲染数据
    this.setData({ ...houseDetail })
  },
})
```

上述代码中如果在地址中包含了 ID 参数，则表明是修改房屋信息，否则是添加房屋，该修改房屋信息与添加房屋是共用的相同页面，因此不需要单独再去对数据进行渲染了。

用户在原来的房屋信息基础上修改后再调用接口再次对数据进行提交，接口与添加房屋是相同的，后端会根据参数中是否包含 ID 来区分是添加或修改的操作。

参考示例代码：

```javascript
Page({
  onLoad() {
    // ...
  },
  getHouseDetail(id) {
    // ...
  },
  // 提交审核
  async submitForm() {
    // 验证数据
    if (!this.validate()) return
    // 获取全部的数据（剔除可能多余参数 __webviewId__）
    const { __webviewId__, status, ...data } = this.data
    // 调用接口
    const { code } = await wx.http.post('/room', data)
    // 检测接口是否调用成功
    if (code !== 10000) return wx.utils.toast('提交数据失败!')

    // 返回房屋列表页面
    wx.navigateBack({ delta: 4 })
  },
})
```

注：修改房屋信息时房屋的状态是不允许进行修改的，因此需要将 `status` 从数据中剔除出来。

### 2.7 删除房屋

删除房屋是根据房屋 ID 来实现的数据删除操作，也是房屋管理的最后一个功能。

在对房屋执行删除操作时用到了 Vant 的两个组件，分别是 `van-swipe-cell` 和 `van-dialog` ，这两个组件的详细使用可以直接查看官方的文档，这两个组件有一个共同的事件 `close`，监听该事件来执行想应的逻辑：

```javascript
Page({
  swipeClose(ev) {
    const { position, instance } = ev.detail
    if (position === 'right') {
      // 显示 Dialog 对话框
      this.setData({
        dialogVisible: true,
      })
      // 记录房屋的 id 和索引，在调用接口的时使用
      this.cellId = ev.mark.id
      this.cellIndex = ev.mark.index
      // swiper-cell 滑块关闭
      instance.close()
    }
  },
  dialogClose(ev) {
    // 当用户点了确认按钮时调用方法删除数据
    if (ev.detail === 'confirm') this.deleteHouse()
  },
})
```

上述代码中通过 `mark:id` 和 `mark:index` 分别将待删除房屋的 ID 和索引传递过来，然后保存在页面实例 `this` 上，目的是在其它方法可以直接进行访问。

接下来封装调用接口的方法：

```javascript
Page({
  swipeClose() {
    // ...
  },
  dialogClose() {
    // ...
  },
  // 删除房屋
  async deleteHouse() {
    // 检测id是否存在
    if (!this.cellId) return wx.utils.toast('参数有误!')
    // 调用接口
    const { code } = await wx.http.delete('/room/' + this.cellId)
    // 检测接口是否调用成功
    if (code !== 10000) return wx.utils.toast()
    // 从 AppData 中将删除的房屋从数组移除
    this.data.houseList.splice(this.cellIndex, 1)
    // 渲染数据
    this.setData({
      houseList: this.data.houseList,
      isEmpty: this.data.houseList.length === 0,
    })
  },
})
```
