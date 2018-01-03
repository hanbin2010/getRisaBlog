var fs = require('fs')
var request = require('sync-request')
var cheerio = require('cheerio')

class KeyaBlog {
    constructor() {
        this.year = ''
        this.date = ''
        this.title = ''
        this.name = ''
        this.article = ''
        this.article_size = 0
        this.imgUrls = []
    }
}

var log = console.log.bind(console)

var blogTime = (e, blog) => {
    var time = e('.box-date')
    var times = time.find('time')
    // var date = time.find('time')[1]
    var split = []
    times.each(function(i, elem) {
        var t = e(this).text()
        split.push(t)
    })
    blog.year = split[0]
    blog.date = split[1]
    return blog
}

var blogImgUrl = (e, blog) => {
    var article = e('.box-article')
    var imgElem = article.find('img')
    var imgUrls = []
    imgElem.each(function(i, elem) {
        var img = e(this).attr('src')
        imgUrls.push(img)
    })
    blog.imgUrls = imgUrls
    return blog
}

var blogFromDiv = (div) => {
    var e = cheerio.load(div)

    var blog = new KeyaBlog()
    blog = blogTime(e, blog)
    var title = e(".box-ttl")
    var name = title.find(".name").text()
    var ttl = title.find("h3").text()
    blog.title = ttl.split(' ').join("").split('\n').join("")
    blog.name = name.split(' ').join("").split('\n').join("")

    var article = e('.box-article')
    blog.article = article.text()
    blog.article_size = blog.article.length
    blog = blogImgUrl(e, blog)

    return blog
}

var cachedUrl = (url) => {
    // 1. 确定缓存的文件名
    var cacheFile = 'cached_html/' + url.split('?')[1] + '.html'
    // 2. 检查缓存文件是否存在
    // 如果存在就读取缓存文件
    // 如果不存在就下载并且写入缓存文件
    var exists = fs.existsSync(cacheFile)
    if (exists) {
        log("exists")
        var data = fs.readFileSync(cacheFile)
        return data
    } else {
        // 用 GET 方法获取 url 链接的内容
        // 相当于你在浏览器地址栏输入 url 按回车后得到的 HTML 内容
        var r = request('GET', url)
        // utf-8 是网页文件的文本编码
        var body = r.getBody('utf-8')
        // 写入缓存
        fs.writeFileSync(cacheFile, body)
        return body
    }
}

var cachedImg = (blogs) => {
    var request = require('request')
    for (var i = 0; i < blogs.length; i++) {
        var b = blogs[i]
        var urls = b.imgUrls
        for (var j = 0; j < urls.length; j++) {
            var url = urls[j]
            var imgName = (blogs.length - i -1) + '_[' + b.title.split('/')[0] + `]_0${j + 1}` + url.slice(-4)
            var path = 'imgs/' + imgName
            // 保存图片的路径
            var exists = fs.existsSync(path)
            if (exists) {
                log("img exists")
                var data = fs.readFileSync(path)
            } else {
                request(url).pipe(fs.createWriteStream(path))
            }
        }
    }

}

var blogsFromUrl = (url) => {
    // 调用 cachedUrl 来获取 html 数据
    // 我们不关心这个函数怎么获取到 HTML, 只要知道它可以根据 url 来返回
    // 我们想要的 HTML 内容即可
    var body = cachedUrl(url)
    // cheerio.load 用来把 HTML 文本解析为一个可以操作的 DOM
    var e = cheerio.load(body)

    // 一共有 25 个 .item
    var blogDivs = e('article')
    // 循环处理 25 个 .item
    var blogs = []
    for (var i = 0; i < blogDivs.length; i++) {
        var div = blogDivs[i]
        // log("div", i, div)
        // 扔给 movieFromDiv 函数来获取到一个 movie 对象
        var b = blogFromDiv(div)
        blogs.push(b)
    }
    return blogs
}

var saveBlog = (blogs) => {
    var s = JSON.stringify(blogs, null, 2)
    var fs = require('fs')
    var path = 'risaBlog.json'
    fs.writeFileSync(path, s)
}

var endFromBlog = (notExistUrl) => {
    var r = request('GET', notExistUrl)
    var body = r.getBody('utf-8')
    var e = cheerio.load(body)
    var pager = e('.pager')
    var list = pager.find('li')
    var lis = []
    list.each(function(i, elem) {
        var li = e(this).text()
        lis.push(li)
    })
    var end = Number(lis.pop())
    return end
}

var __main = () => {
    // 主函数
    var blogs = []
    var notExistUrl = 'http://www.keyakizaka46.com/s/k46o/diary/member/list?ima=0000&page=100000&cd=member&ct=21'
    var end = endFromBlog(notExistUrl)
    for (var i = 0; i < end; i++) {
        var start = i * 25
        var url = `http://www.keyakizaka46.com/s/k46o/diary/member/list?ima=0000&page=${i}&cd=member&ct=21`
        var blogsInPage = blogsFromUrl(url)
        blogs = [...blogs, ...blogsInPage]
    }
    saveBlog(blogs)
    // download covers
    cachedImg(blogs)
}

__main()
