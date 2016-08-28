v2exBetterReply
=====

改善v2ex回复评论的体验：

* 可以指定回复的楼层，同时使用@回复作者；
* 点击楼层号快速插入引用文字；
* 鼠标移动到引用文字上自动显示所引用的内容；
* 点击引用文字跳转到相应楼层；
* 支持跨页引用。

从greasyfork.org安装：[v2exBetterReply](https://greasyfork.org/zh-CN/scripts/22606-v2exbetterreply)

由于greasyfork的规则限制，jQuery使用了来自code.jquery.com的文件。
可以把脚本中的 @require 字段改成v2ex自己的来源(https://cdn.v2ex.com/static/js/jquery.js)以避免性能不佳，或者纯粹重复下载jQuery库文件。
