scanFace () {
      uni.chooseImage({
        count: 1, // 最多选择一张图片
        sourceType: ['camera'], // 只允许从相机选择

        success: (res) => {
          console.log('识别中', res)
          uni.showLoading({
            title: '人脸识别中',
          })
          const tempFilePaths = res.tempFilePaths
          // 在这里处理图片文件
          let detectUrl = this.$API_URL + 'gn-face-recognition/faceRecognize/listUserByPhoto'
          try {
            uni.uploadFile({
              url: detectUrl,
              filePath: tempFilePaths[0],
              name: 'file',
              success: (res) => {
                uni.showLoading({
                  title: '人脸识别中......',
                })
                if (res.statusCode === 200) {
                  let uploadFileResData = JSON.parse(res.data)
                  if (
                    uploadFileResData.code === '000000' &&
                    uploadFileResData.data.length !== 0
                  ) {
                    // 成功情况下
                    uni.hideLoading()
                    uni.showToast({
                      icon: 'none',
                      title: '识别成功',
                    })
                    /!*this.$Router.push({
                      path: '/pages/leader/ryhy/index',
                    })*!/
                    uni.navigateTo({
                      url: '/pages/leader/ryhy/index',
                    })
                    uni.$emit('res', uploadFileResData)
                  } else {
                    uni.hideLoading()
                    uni.showToast({
                      icon: 'none',
                      title: '未找到相关人员信息',
                    })
                  }
                }
              },
              fail: (res) => {
                console.log('失败', res);
              },
            })
          } catch (e) {
            console.log(e)
          }
        },
      })
    },