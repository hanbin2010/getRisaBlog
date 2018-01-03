var fs = require('fs')
var request = require('sync-request')
var cheerio = require('cheerio')

var log = console.log.bind(console)

var mergeHtml = (url) => {
    // 1. 确定缓存的文件名
    var cacheFile = 'cached_html/' + 'risa_blog_merged.html'
    // 用 GET 方法获取 url 链接的内容
    // 相当于你在浏览器地址栏输入 url 按回车后得到的 HTML 内容
    var r = request('GET', url)
    // utf-8 是网页文件的文本编码
    var body = r.getBody('utf-8')
    // 写入缓存
    fs.writeFileSync(cacheFile, body)
}

var saveBlog = (blogs) => {
    var s = JSON.stringify(blogs, null, 2)
    var fs = require('fs')
    var path = 'risaBlog.txt'
    fs.writeFileSync(path, s)
}

var downloadBlogImgs = (blogs) => {
    var request = require('request')
    for (var i = 0; i < blogs.length; i++) {
        // for (var i = 0; i < 3; i++) {
        var b = blogs[i]
        var urls = b.imgUrls
        // for (var i = 0; i < 1; i++) {
        for (var j = 0; j < urls.length; j++) {
            var url = urls[j]
            // 保存图片的路径
            var path = 'imgs/' + (blogs.length - i -1) + '_[' + b.title.split('/')[0] + `]_0${j + 1}` + url.slice(-4)
            request(url).pipe(fs.createWriteStream(path))
            log("downloadBlogImgs", j)
        }
    }
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
        mergeHtml(url)
        // blogs = [...blogs, ...blogsInPage]
    }
    // saveBlog(blogs)
    // download covers
    // downloadBlogImgs(blogs)
}

__main()
