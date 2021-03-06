const util = require('../../utils/util.js')
var Bmob = require("../../utils/bmob.js");
/**
 * 音频相关
 */
var innerAudioContext;
var timeLittleContext;
var readyContext;
var askContext;
var gameOverContext; 
var clickContext;
var stopStatus = "none"

var mainBgmPath = "http://bmob-cdn-9637.b0.upaiyun.com/2018/05/23/021776c640e818fb805286d722671273.mp3";
var timeLittlePath = "http://bmob-cdn-9637.b0.upaiyun.com/2018/05/23/5516d59a40ed7d23805e17895c4e1759.mp3";
var readyPath = "http://bmob-cdn-9637.b0.upaiyun.com/2018/05/23/918ebffd40cb11ab808cab11101d0ee8.mp3";
var yesNPath = "http://bmob-cdn-9637.b0.upaiyun.com/2018/05/23/be1fb49c401ae8f68029441d29a1b17e.mp3";
var yes4Path = "http://bmob-cdn-9637.b0.upaiyun.com/2018/05/23/f8c61306401d4cac8034fc5f5f6b68cb.mp3";
var yes3Path = "http://bmob-cdn-9637.b0.upaiyun.com/2018/05/23/d3ec0980406f087b80bf4cb1f914d65c.mp3";
var yes2Path = "http://bmob-cdn-9637.b0.upaiyun.com/2018/05/23/a721416b40de5c79807d69f08518fe40.mp3";
var yes1Path = "http://bmob-cdn-9637.b0.upaiyun.com/2018/05/23/81edc704409779eb8019658412d7abd5.mp3";
var askErroPath = "http://bmob-cdn-9637.b0.upaiyun.com/2018/05/23/1638b805404eb28a80760134af0ea392.mp3";

var gameOverPath = "http://bmob-cdn-9637.b0.upaiyun.com/2018/05/23/9426c3d6407fafe78060c9a654c13d2c.mp3";
var clickPath = "http://bmob-cdn-9637.b0.upaiyun.com/2018/05/23/12654a5c40cc005d806698913c66ea93.mp3";


//获取应用实例
const app = getApp();
var _this = this;
var thisQustions = new Array; //本次的答题
var myChoose = new Array; //记录我的选择
var answerNum = 10; //每次答题个数
var thisIndex = 0; //当前题目下标
var thisCorrectAnswer = 0 //当前题的正确答案
var disorganizeAnswers = new Array; //本次答题的选择列表
var countdownNum = 20; //倒计时
var lastCountNum = 0; //记录关闭倒计时时的最后num
var currentCountdownNum = 0; //当前倒计时到第几
var interval;
var varName;
var ctx = wx.createCanvasContext('canvasArcCir');

Page({
  data: {
    thisTitle: '', //当前题目
    thisAnswer: '', //当前题目的选项

    countdown: countdownNum, //倒计时
    answerNo: answerNum,
    thisIndex: thisIndex, //第几道题
    continuousYes: 0, //连续答对个数
    interval: "", //定时器
    proScoreInterval: "", //得分进度条定时器
    lastNum: 0,
    time: countdownNum, //初始时间
    count: 0, // 设置 计数器 初始为0
    countTimer: null, // 设置 定时器 初始为null
    local_click: false, //是否本地单击的答案

    click_index: '', //判断用户选择了哪个答案
    answer_color: '', //根据选择正确与否给选项添加背景颜色
    score_myself: 0, //自己的总分
    score_myself_progress: 0, //自己的总分  用于进度条

    game_over: false, //判断此次PK是否结束
    win: false, //判断当前用户是否胜利
    sendNumber: 0 //每一轮的答题次数不能超过1次
  },
  onLoad: function(options) {
    _this = this;
    this.setData({
      userInfo_icon: wx.getStorageSync('icon'),
    })
    this.fighting_ready() //查询数据
  },

  onReady: function() {
    //创建并返回绘图上下文context对象。 
    // 页面渲染完成  
    this.drawProgressbg();
  },
  loadingTap: function() {
    wx.showLoading({
      title: 'loading',
    })
  },
  fighting_ready: function() {
    let that = this;
    that.loadingTap();
    var answerUrl;
    var jId;
    try {
      answerUrl = wx.getStorageSync('biblequiz_mainurl') + wx.getStorageSync('biblequiz_getRandQuestions')
      jId = wx.getStorageSync('bq_jsessionid')
    } catch (e) {}

    wx.request({
      url: answerUrl,
      method: 'POST',
      dataType: 'json',
      data: {
        JSESSIONID: jId
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      success(res) {
        wx.hideLoading()
        // console.log(JSON.stringify(res.data));
        if (res.data.status == 200) {
          thisQustions = res.data.data
          that.startAnimate(); //定义开始动画
          that.initThisAnswer();
        } else {
          wx.showModal({
            title: '提示',
            content: res.data.message,
            showCancel: false,
            success(res) {}
          })
        }


      },
      fail(e) {
        console.log('fail:' + res.errMsg)
        wx.hideLoading()
      }
    })
  },
  restAnswer: function() {
    this.data.count = 0;
    //获取新题目后,倒计时归为10，将click_index清空，ha_click改为未选择.
    this.setData({
      countdown: countdownNum,
      local_click: false,

      click_index: '',
      answer_color: '',
      sendNumber: 0
    })
    clearInterval(this.countTimer);
    var that = this;
    that.init(that);
    this.startTap();

  },

  initThisAnswer: function() { //初始化当前题目
    if (thisQustions == null) {
      return;
    }
    _this.restAnswer(); //初始化

    disorganizeAnswers = thisQustions[thisIndex].options.split("&") //字符分割 
    thisCorrectAnswer = thisQustions[thisIndex].solution

    this.setData({
      thisTitle: thisQustions[thisIndex].title,
      mytitle: 'lightSpeedIn-left', //标题动画 
      thisAnswer: disorganizeAnswers
    })
  },



  answer(e) { //开始答题
    const that = this

    if (this.data.time <= 10) {
      this.pauseBgm();
    }
    this.stopTap();
    that.startOtherBgm('tap')

    if (!that.data.local_click) { //防止重新选择答案
      that.setData({
        local_click: true
      })


      if (e.currentTarget.dataset.index == thisCorrectAnswer) { //判断答案是否正确
        that.data.continuousYes++

          //that.startOtherBgm('y2')
          //此处有播放音频bug  先关掉
          if (true) {
            switch (that.data.continuousYes) {
              case 1:
                that.startOtherBgm('y1')
                break
              case 2:
                that.startOtherBgm('y1')
                break
              case 3:
                that.startOtherBgm('y1')
                break
              case 4:
                that.startOtherBgm('y1')
                break
              default:
                that.startOtherBgm('y')
                break
            }
          } else {
            switch (that.data.continuousYes) {
              case 1:
                that.startOtherBgm('y1')
                break
              case 2:
                that.startOtherBgm('y2')
                break
              case 3:
                that.startOtherBgm('y3')
                break
              case 4:
                that.startOtherBgm('y4')
                break
              default:
                that.startOtherBgm('y')
                break
            }
          }


        //设置按钮为正确颜色
        that.setData({
          click_index: e.currentTarget.dataset.index,
          answer_color: 'right'
        })

        //答对了则加分，时间越少加分越多,总分累加
        that.countScore()



        setTimeout(function() {
          if (thisIndex == thisQustions.length) {
            that.gameOverContext.play()
            that.setData({
              game_over: true,
              win: true
            })

            wx.getStorage({
              key: 'objid',
              success: function(res) {
                var Diary = Bmob.Object.extend("User");
                var query = new Bmob.Query(Diary);
                query.get(res.data, {
                  success: function(result) {
                    console.log(result.get("mscore") + "返回" + result.get("a_number"))
                    let mmAnumber = 0
                    if (result.get("a_number") != null && result.get("a_number") != "") {
                      mmAnumber = result.get("a_number")
                    }
                    let mmcore = (that.data.score_myself + result.get("mscore")) / 2
                    mmcore = Math.floor(mmcore * 100) / 100;
                    console.log("结算传送=(" + result.get("mscore") + "+" + that.data.score_myself + ")/2==" + mmcore)
                    result.set('mscore', mmcore)
                    result.set('a_number', mmAnumber++)
                    result.save();
                  },
                  error: function(object, error) {}
                });
              }
            })



          } else {
            _this.initThisAnswer();
          }
        }, 1500)

      } else {


        that.setData({
          click_index: e.currentTarget.dataset.index,
          answer_color: 'error',
          continuousYes: 0
        })


        that.setData({
          rightChoose: thisCorrectAnswer,
          rightChooseColor: 'right'
        })


        that.startOtherBgm('erro')
        that.setData({
          score_myself: 0
        })


        wx.getStorage({
          key: 'objid',
          success: function(res) {
            var Diary = Bmob.Object.extend("User");
            var query = new Bmob.Query(Diary);
            query.get(res.data, {
              success: function(result) {
                let mmAnumber = 0
                if (result.get("a_number") != null && result.get("a_number") != "") {
                  mmAnumber = result.get("a_number")
                }
                mmAnumber += 1
                console.log('答题次数==' + mmAnumber)
                result.set('a_number', mmAnumber)
                result.set('mscore', 0)
                result.save();
              },
              error: function(object, error) {}
            });
          }
        })




        setTimeout(function() {
          that.gameOverContext.play()
          that.pauseBgm();
          that.stopTap();
          that.setData({
            game_over: true,
            win: true
          })
        }, 1500)
      }
     
      thisIndex += 1
      if (thisIndex < answerNum) {
        that.setData({
          thisIndex: thisIndex
        })
      }
    }
    that.clearTimeInterval(that);
  },
  /**
   * 计算得分
   */
  countScore: function() {
    let that = this;
    let theScore;

    if (that.data.time >= 16) {
      theScore = 10
    } else if (that.data.time >= 13) {
      theScore = 8
    } else if (that.data.time >= 7) {
      theScore = 6
    } else {
      theScore = 4
    }
    theScore += that.data.score_myself
    that.setData({
      score_myself: theScore
    })

  },
  continue_fighting: function() {
    wx.navigateBack({
      delta: 1
    })
  },
  lookback: function() {

    let answers = JSON.stringify(thisQustions)
    let choose = JSON.stringify(myChoose)
    wx.navigateTo({
      url: '../lookback/lookback?id=1&alist=' + answers + '&clist=' + choose
    })
    stopStatus = "over"
    that.clearTimeInterval(that);
    that.closeBgm();
  },
  startAnimate: function() {
    const that = this

    that.readyContext.play()
    that.setData({
      zoomIn: 'zoomIn'
    })
    setTimeout(function() {
      // _this.initQuestionBank(allQustions);
      that.setData({
        zoomOut: 'zoomOut'
      })
    }, 1500)
  },
  drawProgressbg: function() {
    // 使用 wx.createContext 获取绘图上下文 context
    var ctx = wx.createCanvasContext('canvasProgressbg')
    ctx.setLineWidth(3); // 设置圆环的宽度
    ctx.setStrokeStyle('#AAD0FF'); // 设置圆环的颜色
    ctx.setLineCap('round') // 设置圆环端点的形状
    ctx.beginPath(); //开始一个新的路径
    ctx.arc(45, 45, 35, 0, 2 * Math.PI, false);
    //设置一个原点(100,100)，半径为90的圆的路径到当前路径
    ctx.stroke(); //对当前路径进行描边
    ctx.draw();
  },
  drawCircle: function(step) {
    var context = wx.createCanvasContext('canvasProgress');
    // 设置渐变
    var gradient = context.createLinearGradient(200, 100, 100, 200);

    gradient.addColorStop("0", "#22FF1E");
    gradient.addColorStop("0.6", "#DDE83D");
    gradient.addColorStop("1.0", "#F00011");
  
    context.setLineWidth(4);
    context.setStrokeStyle(gradient);
    context.setLineCap('round')
    context.beginPath();
    // 参数step 为绘制的圆环周长，从0到2为一周 。 -Math.PI / 2 将起始角设在12点钟位置 ，结束角 通过改变 step 的值确定
    context.arc(45, 45, 35, -Math.PI / 2, step * Math.PI - Math.PI / 2, false);
    context.stroke();
    context.draw()
  },

  /**
   * 开始倒计时
   */
  startTap: function() {

    this.startBgm();
    this.goCountNum(true);
  },
  /**
   * 暂停倒计时
   */
  stopTap: function() {
    var that = this;

    that.setData({
      lastNum: that.data.time
    })
    that.clearTimeInterval(that)
  },
  /**
   * 继续倒计时
   */
  restartTap: function() {
    this.goCountNum(false);
  },


  /**
   * isRe:是否重新计时
   */
  goCountNum: function(isRe) {
    let convertUnitTemp = 0;
    var that = this;
    that.init(that); //这步很重要，没有这步，重复点击会出现多个定时器

    var time = countdownNum;
    if (that.data.lastNum != null && that.data.lastNum != 0 && !isRe) {
      time = that.data.lastNum;

      time--
    }


    var interval = setInterval(function() {
      _this.drawCircle(2 - _this.data.count / (countdownNum * 10 / 2))

      if (convertUnitTemp == 10) {
        time--;
        _this.setData({
          countdown: time
        })
        _this.setData({
          time: time
        })
        convertUnitTemp = 0;

      }
      convertUnitTemp++;

      if (time == 0) {
        that.clearTimeInterval(that);
        that.setData({
          game_over: true,
          win: true
        })
        that.startOtherBgm('erro')
        that.gameOverContext.play()
      } else if (time == 10) {
        if (that.timeLittleContext != null) {
          that.pauseBgm()
          that.timeLittleContext.play()
        }
      }
      _this.data.count++;
    }, 100)

    that.setData({
      interval: interval
    })
  },
  /**
   * 初始化数据
   */
  init: function(that) {
    var time = countdownNum;
    if (that.data.lastNum != null && that.data.lastNum != 0) {
      time = that.data.lastNum;
    }
    var interval = ""
    that.clearTimeInterval(that)
    that.setData({
      time: time,
      interval: interval
    })
  },
  onShareAppMessage: function(res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log(res.target)
    }
    return {
      title: '今天的读经U记住了吗？',
      path: '/pages/main/main'
    }
  },
  /**
   * 清除interval
   * @param that
   */
  clearTimeInterval: function(that) {
    var interval = that.data.interval;
    clearInterval(interval)
  },
  initBgm: function() {
    var that = this;
    console.log("初始化音频");
    that.innerAudioContext = wx.createInnerAudioContext();
    that.innerAudioContext.autoplay = false //是否自动播放
    that.innerAudioContext.loop = true //是否循环播放
    that.innerAudioContext.src = mainBgmPath
    that.innerAudioContext.onPlay(() => {})
    that.innerAudioContext.onError((res) => {})

    that.timeLittleContext = wx.createInnerAudioContext()
    that.timeLittleContext.autoplay = false //是否自动播放
    that.timeLittleContext.loop = false //是否循环播放
    that.timeLittleContext.src = timeLittlePath
    that.timeLittleContext.onPlay(() => {})
    that.timeLittleContext.onError((res) => {})

    that.timeLittleContext = wx.createInnerAudioContext()
    that.timeLittleContext.autoplay = false //是否自动播放
    that.timeLittleContext.loop = false //是否循环播放
    that.timeLittleContext.src = timeLittlePath
    that.timeLittleContext.onPlay(() => {})
    that.timeLittleContext.onError((res) => {})

    that.readyContext = wx.createInnerAudioContext()
    that.readyContext.autoplay = false //是否自动播放
    that.readyContext.loop = false //是否循环播放
    that.readyContext.src = readyPath
    that.readyContext.onPlay(() => {})
    that.readyContext.onError((res) => {})

    that.askContext = wx.createInnerAudioContext()
    that.askContext.autoplay = false //是否自动播放
    that.askContext.loop = false //是否循环播放
    that.askContext.src = yes1Path
    that.askContext.onPlay(() => {})
    that.askContext.onError((res) => {})

    that.gameOverContext = wx.createInnerAudioContext()
    that.gameOverContext.autoplay = false //是否自动播放
    that.gameOverContext.loop = false //是否循环播放
    that.gameOverContext.src = gameOverPath
    that.gameOverContext.onPlay(() => {})
    that.gameOverContext.onError((res) => {})

    that.clickContext = wx.createInnerAudioContext()
    that.clickContext.autoplay = false //是否自动播放
    that.clickContext.loop = false //是否循环播放
    that.clickContext.src = clickPath
    that.clickContext.onPlay(() => {})
    that.clickContext.onError((res) => {})
  },
  /**
   * 播放音频
   */
  startBgm: function() {
    var that = this;
    if (that.innerAudioContext == null) {
      that.initBgm();
    }
    if (that.timeLittleContext != null) {
      that.timeLittleContext.stop()
    }
    that.innerAudioContext.play()
  },
  pauseBgm: function() {
    var that = this;
    if (that.innerAudioContext == null) {
      return;
    }
    if (that.timeLittleContext != null) {
      that.timeLittleContext.pause()
    }
    that.innerAudioContext.pause()
  },
  /**
   * 生命周期函数--监听页面隐藏
   * 在后台运行时停止计时器
   */
  onHide: function() {

    this.pauseBgm();
    this.stopTap();
  },
  onShow: function() {
    if (stopStatus != "over") {
      var that = this;
      if (that.innerAudioContext == null) {
        that.initBgm()
      } else {
        if (this.data.lastNum != null && this.data.lastNum != 0) {
          this.restartTap();
          if (this.data.lastNum <= 10) {
            that.timeLittleContext.play()
          } else {
            that.startBgm();
          }
        }
      }
    }


  },
  closeBgm: function() {
    var that = this;
    if (that.innerAudioContext != null) {
      that.innerAudioContext.stop()
      that.innerAudioContext.destroy()

      that.timeLittleContext.stop()
      that.timeLittleContext.destroy()

      that.readyContext.stop()
      that.readyContext.destroy()

      that.askContext.stop()
      that.askContext.destroy()

      that.gameOverContext.stop()
      that.gameOverContext.destroy()

      that.clickContext.stop()
      that.clickContext.destroy()
    }
  },
  /**
   * tap:点击
   * erro:错误
   * y:选择正确
   */
  startOtherBgm: function(playType) {
    if (playType == null || playType.length < 1 && that.askContext != null) {
      return;
    }
    var that = this;
    if (playType == "tap") {
      that.askContext.src = clickPath
    } else if (playType == "erro") {
      that.askContext.src = askErroPath
    } else if (playType == "y1") {
      that.askContext.src = yes1Path
    } else if (playType == "y2") {
      that.askContext.src = yes2Path
    } else if (playType == "y3") {
      that.askContext.src = yes3Path
    } else if (playType == "y4") {
      that.askContext.src = yes4Path
    } else if (playType == "y") {
      that.askContext.src = yesNPath
    }
    that.askContext.play()

  },

  /**
   * 生命周期函数--监听页面卸载
   * 退出本页面时停止计时器
   */
  onUnload: function() {
    var that = this;
    stopStatus = "none"
    thisQustions = ""
    thisQustions = new Array
    myChoose = ""
    myChoose = new Array

    thisIndex = 0;
    that.setData({
      thisIndex: 0
    })
    that.clearTimeInterval(that);
    that.closeBgm();
  }
})