# 享+生活 - 第 4 天

## 一、访客管理

访客管理是当有朋友到家里做客时，通过在线填写申请单的方式向门卫进行报备，并请求门卫放行。

### 1.1 访客邀请

填写访客邀请单，需要用户保持登录的状态。

首先来获取表单的数据

1. 获取到访的房屋信息，仍然用到了 `van-action-sheet` 组件，获取数据通过坚挺 `select` 实现：

   ```javascript
   // visitor_pkg/pages/form/index.js
   Page({
     data: {
       houseList: [],
     },
     onLoad() {
       // 获取房屋列表
       this.getHouseList()
     },
     // 获取房屋列表
     async getHouseList() {
       // 调用接口
       const { code, data: houseList } = await wx.http.get('/house')
       // 检测接口是否调用成功
       if (code !== 10000) return wx.utils.toast()
       // 渲染数据
       this.setData({ houseList })
     },
     // 获取用户选择的房屋
     selectHouseInfo(ev) {
       // 记录获取的数据
       this.setData({
         houseId: ev.detail.id,
         houseInfo: ev.detail.name,
       })
     },
   })
   ```

2. 获取到访日期，仍然用到了 `van-datepicker` 组件，通过监听 `confirm` 事件获取选择的时间：

   ```javascript
   // visitor_pkg/pages/form/index.js
   Page({
     data: {
       currentDate: Date.now(),
       maxDate: Date.now() + 1000 * 3600 * 24 * 3,
     },
     // 获取用户选择的日期
     selectDateInfo(ev) {
       // 记录获取的时间并隐藏弹层
       this.setData({
         visitDate: wx.utils.dataFormat(ev.detail),
         dateLayerVisible: false,
       })
     },
   })
   ```

   在选择时间的时候要求只能提前 3 天进行申请，即时间的最大值距离今天不能超过 3 天。

其次对表单的数据进行验证：

```javascript
// visitor_pkg/pages/form/index.js
// 导入验证插件
import wxValidate from 'wechat-validate'
Page({
  behaviors: [wxValidate],
  data: {
    name: '',
    gender: 1,
    mobile: '',
    houseId: '',
    visitDate: '',
  },
  rules: {
    name: [
      { required: true, message: '访客姓名不能为空!' },
      { pattern: /[\u4e00-\u9fa5]{2,5}/, message: '访客姓名只能为中文!' },
    ],
    mobile: [
      { required: true, message: '访客手机号不能为空!' },
      { pattern: /^1[3-8]\d{9}$/, message: '请填写正确的手机号码!' },
    ],
    houseId: [{ required: true, message: '请选择到访的房屋!' }],
    visitDate: [{ required: true, message: '请选择到访的日期!' }],
  },
})
```

最后提交表单的数据

```javascript
// visitor_pkg/pages/form/index.js
// 导入验证插件
import wxValidate from 'wechat-validate'
Page({
  behaviors: [wxValidate],
  data: {
    // ...
  },
  rules: {
    // ...
  },
  onLoad() {},
  getHouseList() {},
  // 提交表单数据
  async goPassport() {
    // 验证表单数据
    if (!this.validate()) return
    // 获取接口需要的数据
    const { name, gender, mobile, houseId, visitDate } = this.data
    // 调用接口
    const {
      code,
      data: { id },
    } = await wx.http.post('/visitor', { name, gender, mobile, houseId, visitDate })
    // 检测接口是否调用成功
    if (code !== 10000) return wx.utils.toast()
    // 跳转到访客详情页面
    wx.reLaunch({
      url: '/visitor_pkg/pages/passport/index?id=' + id,
    })
  },
})
```

填写完访客邀请后跳转到访客详情页面。

### 1.2 访客详情

获取访客详情有两种情况：

1. 用户保持登录状态，根据 ID 调用接口获取访客详情的数据

   [接口文档地址](https://apifox.com/apidoc/shared-8d66c345-7a9a-4844-9a5a-1201852f6faa/api-41400761)

   参考示例代码如下：

   ```javascript
   // visitor_pkg/pages/passport/index.js
   Page({
     data: {
       passport: {},
     },
     onLoad({ id }) {
       // 获取访客详情
       this.getPassport(id)
     },
     // 获取访客详情（通行证）
     async getPassport(id) {
       // 检测是否存在 id
       if (!id) return
       // 调用接口
       const { code, data: passport } = await wx.http.get('/visitor/' + id)
       // 检测接口是否调用成功
       if (code !== 10000) return wx.utils.toast()
       // 渲染数据
       this.setData({ passport })
     },
   })
   ```

   把接口返回的详情数据渲染到页面当中：

   ```xml
   <view class="passport">
     <view class="countdown">
       <van-count-down wx:if="{{passport.validTime > 0}}" time="{{passport.validTime * 1000}}" />
       <view wx:else class="van-count-down">00:00:00</view>
       <view class="label">通行证有效时间</view>
     </view>
     <view class="qrcode">
       <image src="{{passport.url}}"></image>
       <view wx:if="{{passport.validTime === -1}}" class="mask">二维码失效</view>
     </view>
     <view class="description">
       <view class="house">{{passport.houseInfo}}</view>
       <view class="tips">将此二维码分享给访客，访客扫码即可开门</view>
     </view>
   </view>
   <view class="toolbar">
     <button class="button-share" open-type="share">
       <text class="enjoy-icon icon-share"></text>
       <text class="text">分享给朋友</text>
     </button>
     <button class="button-save">
       <text class="enjoy-icon icon-save"></text>
       <text class="text">保存到本地</text>
     </button>
   </view>
   ```

   访客详情中的二维码有时效性，当过期后数据 `validTime` 的值为 -1，此时将不会再展示倒计时组件了，同时二维码上方出现一个半透明的蒙层。

2. 用户打开的分享页面（新用户未登录）

访客详情页面是允许用户分享给朋友的，此种情况下被分享的用户可能是新用户或处于未登录的状态，此时要获取访客详情数据需要借助另外一个接口，传递的参数为 `encryptedData`，这个数据在第 1 次分享时被拼凑到了分享页面的 URL 后面：

```javascript
// visitor_pkg/pages/passport/index.js
Page({
  data: {},
  onLoad() {},
  // 自定义分享
  onShareAppMessage() {
    // 获取加密数据
    const { encryptedData } = this.data.passport
    return {
      title: '查看通行证',
      path: '/visitor_pkg/pages/passport/index?encryptedData=' + encryptedData,
      imageUrl: 'https://enjoy-plus.oss-cn-beijing.aliyuncs.com/images/share_poster.png',
    }
  },
})
```

当打开页面检测到 URL 中包含了 `encryptedData` 数据，则表明是通过分享打开的页面，然后调用接口获取访客详情的数据：

[接口文档地址](https://apifox.com/apidoc/shared-8d66c345-7a9a-4844-9a5a-1201852f6faa/api-44620011)

```javascript
// visitor_pkg/pages/passport/index.js
Page({
  onLoad({ id, encryptedData }) {
    // 获取访客详情
    this.getPassport(id)
    this.getPassportShare(encryptedData)
  },
  async getPassport(id) {},
  async getPassportShare(encryptedData) {
    // 检测是否存在 id
    if (!encryptedData) return
    // 调用接口
    const { code, data: passport } = await wx.http.get('/visitor/share/' + encryptedData)
    // 检测接口是否调用成功
    if (code !== 10000) return wx.utils.toast()
    // 渲染数据
    this.setData({ passport })
  },
})
```

此种情况下渲染数据时就不允许用户再次分享页面了，需要把分享按钮隐藏起来：

```xml
<view class="toolbar" wx:if="{{passport.encryptedData}}">
  <button class="button-share" open-type="share">
    <text class="enjoy-icon icon-share"></text>
    <text class="text">分享给朋友</text>
  </button>
  <button class="button-save">
    <text class="enjoy-icon icon-save"></text>
    <text class="text">保存到本地</text>
  </button>
</view>
```

### 1.3 保存图片

小程序提供了保存图片到相册的 API，调用 API 来把二维码保存到相册当中。

```xml
<view class="toolbar" wx:if="{{passport.encryptedData}}">
  <button class="button-share" open-type="share">
    <text class="enjoy-icon icon-share"></text>
    <text class="text">分享给朋友</text>
  </button>
  <button bind:tap="saveQRCode" class="button-save">
    <text class="enjoy-icon icon-save"></text>
    <text class="text">保存到本地</text>
  </button>
</view>
```

`wx.getImageInfo` 通过图片路径来读取图片信息，调用该 API 时需要在小程序管理后台添加 `download` 域名。

```javascript
wx.getImageInfo({
  src: 'https://domain.com/path/xxx.jpg',
  success(result) {
    console.log(result)
  },
})
```

`wx.saveImageToPhotosAlbum` 将图片保存到相册，第一次调用会弹出授权窗口。

```javascript
wx.saveImageToPhotosAlbum({
  filePath: '待保存的图片路径（通过 wx.getImageInfo 读取到的）',
  success(result) {
    console.log(result)
  },
})
```

结合项目组合使用这两个 API 来保存图片到相册

```javascript
// visitor_pkg/pages/passport/index.js
Page({
  data: {},
  onLoad() {},
  // 保存二维码
  async saveQRCode() {
    try {
      // 读取图片信息
      const { path } = await wx.getImageInfo({
        // 二维码的图片路径
        src: this.data.passport.url,
      })
      // 保存图片到相册
      wx.saveImageToPhotosAlbum({ filePath: path })
    } catch (err) {
      wx.utils.toast('保存图片失败，稍后重试!')
    }
  },
})
```

### 1.4 访客列表

在用户保持登录状态时调用接口获取访客列表的数据，此接口支持分页获取数据。

[接口文档地址](https://apifox.com/apidoc/shared-8d66c345-7a9a-4844-9a5a-1201852f6faa/api-41400761)

首先来获取不分页时的列表数据

参考示例代码如下所示：

```javascript
// visitor_pkg/pages/list/index.js
Page({
  data: {
    visitorList: [],
    isEmpty: false,
  },
  onLoad() {
    // 获取访客列表
    this.getVisitorList()
  },
  // 访客列表接口
  async getVisitorList(current = 1, pageSize = 5) {
    // 调用接口
    const {
      code,
      data: { rows: visitorList },
    } = await wx.http.get('/visitor', { current, pageSize })
    // 检测接口是否调用成功
    if (code !== 10000) return wx.utils.toast()
    // 渲染数据
    this.setData({
      isEmpty: visitorList.length === 0,
      visitorList,
    })
  },
})
```

渲染访客列表数据：

```xml
<block wx:if="{{!isEmpty}}">
  <scroll-view show-scrollbar="{{false}}" enhanced scroll-y>
    <view class="visitor">
      <view class="visitor-title">我的访客</view>
      <view class="visitor-list">
        <van-cell-group
          wx:for="{{visitorList}}"
          wx:key="id"
          border="{{false}}"
          bind:tap="goPassport"
        >
          <van-cell size="large" title="{{item.houseInfo}}">
            <text wx:if="{{item.status === 1}}" class="tag success">生效中</text>
            <text wx:if="{{item.status === 0}}" class="tag cancel">已失效</text>
          </van-cell>
          <van-cell title="访客姓名" border="{{false}}" value="{{item.name}}" />
          <van-cell title="手机号码" border="{{false}}" value="{{item.mobile}}" />
          <van-cell title="访问日期" border="{{false}}" value="{{item.visitDate}}" />
        </van-cell-group>
      </view>
    </view>
  </scroll-view>
</block>
<view wx:else class="blank">
  您还没有访客记录，请点击
  <navigator hover-class="none" class="link" url="/visitor_pkg/pages/form/index">添加</navigator>
</view>

```

在渲染数据时注意列表为空时要给用户一段提示内容，通过 `isEmpty` 进行判断，访客邀请有两个状态：

- 0 表示生效中，对应的类名为 `success`
- 1 表示已失效，对应的类名为 `cancel`

其次来分页获取数据，先监听 `bind:scrolltolower` 事件，当用户滚动页面到达底部时再去请求分页的数据：

```xml
<block wx:if="{{!isEmpty}}">
  <scroll-view
  	bind:scrolltolower="getMoreVisitor"
    show-scrollbar="{{false}}"
    enhanced
    scroll-y
  >
    <view class="visitor">
      ....
    </view>
  </scroll-view>
</block>
<view wx:else class="blank">
  您还没有访客记录，请点击
  <navigator hover-class="none" class="link" url="/visitor_pkg/pages/form/index">添加</navigator>
</view>

```

`scrolltolower` 事件有可能会在短时间内被重复触发，此种情形下会通过节流函数来避免无意义的请求，节流函数的创建可以使用第三方的库 `miniprogram-licia`

```bash
# 安装 miniprogram-licia
npm install miniprogram-licia
```

安装完成后再执行 npm 构建就[可以使用](https://github.com/liriliri/licia/blob/HEAD/README_CN.md)了。

```javascript
// visitor_pkg/pages/list/index.js
// 导入 licia 提供的节流函数
import { throttle } from 'miniprogram-licia'
Page({
  data: {},
  onLoad() {
    // 事件回调函数
    this.getMoreVisitor = throttle(() => {
      // 创建了节流函数
    }, 100)
  },
})
```

节流函数创建好之后就可以分页获取数据了，先来记录下当前的页面，然后每次调用时将页码加 1，最后把新的数据追加到页面中渲染：

```javascript
Page({
  data: {
    // ...
  },
  onLoad() {
    // 事件回调函数
    this.getMoreVisitor = throttle(() => {
      // 创建了节流函数
      this.getVisitorList(++this._current)
    }, 100)
  },
  // 访客列表接口
  async getVisitorList(current = 1, pageSize = 5) {
    // 调用接口
    const {
      code,
      data: { rows: visitorList },
    } = await wx.http.get('/visitor', { current, pageSize })
    // 检测接口是否调用成功
    if (code !== 10000) return wx.utils.toast()
    // 渲染数据
    this.setData({
      isEmpty: visitorList.length === 0,
      visitorList: this.data.visitorList.concat(visitorList),
    })
    // 记录下来当前的页面
    this._current = current
  },
})
```

还要考虑所有分页的数据都请求完后就无需再次请求了，可以对比当前页码 `current` 和总页码 `pageTotal` 来判断是否还有更多的数据：

```javascript
Page({
  data: {
    // ...
  },
  onLoad() {
    // 事件回调函数
    this.getMoreVisitor = throttle(() => {
      // 没有更多数据了...
      if(!this.data.hasMore) return
			// 创建了节流函数
      this.getVisitorList(++this._current)
    }, 100)
  },
  // 访客列表接口
  async getVisitorList(current = 1, pageSize = 5) {
    // 调用接口
    const {
      code,
      data: { pageTotal, rows: visitorList },
    } = await wx.http.get('/visitor', { current, pageSize })
    // 检测接口是否调用成功
    if (code !== 10000) return wx.utils.toast()
    // 渲染数据
    this.setData({
      hasMore: current < pageTotal
      isEmpty: visitorList.length === 0,
      visitorList: this.data.visitorList.concat(visitorList),
    })
    // 记录下来当前的页面
    this._current = current
  },
})
```

到此享+生活的开发就结束了！
