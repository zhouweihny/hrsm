var conf = 0; //控制服务
var srvMap = (function(){
	var srcPref = ["", "http://192.168.96.68:8080/"];//本地
    var dataArray = [
         {

         },
         {

         }
    ];
    
    return {
        add: function(uid, mockSrc, srvSrc) {
            dataArray[0][uid] = srcPref[conf] + mockSrc;
            dataArray[1][uid] = srcPref[conf] + srvSrc;         
        },
        get: function(uid) {
            return dataArray[conf][uid];
        },
        getPath:function(){
        	return srcPref[conf];
        },
        dataArrays:function(){
            return dataArray[conf];
        }
    };
})(jQuery);
window.dataArray = srvMap.dataArrays();

;(function (doc, win) {
    var docEl = doc.documentElement,
        resizeEvt = "orientationchange" in window ? "orientationchange" : "resize",
        recalc = function(){
            var clientWidth = docEl.clientWidth;
            if(clientWidth<=640 && clientWidth>=320){ //判断最小320 屏幕，最大640，当然也可以不加 
                if(!clientWidth) return;
                docEl.style.fontSize = 20 * (clientWidth / 320) + "px";
            }else{
                docEl.style.fontSize = "40px";
            }
        };
    if(!doc.addEventListener) return;
    win.addEventListener(resizeEvt, recalc, false);
    doc.addEventListener("DOMContentLoaded", recalc, false);
})(document, window);

$.PostJson = function(url, datas , callback) {
    $.ajax({
        url: url,
        type: "POST",
        data : datas +"&_=" + (new Date()).getTime(),
        cache: false,
        dataType: "json",
        timeout: 20000,
        beforeSend: function (xhr) {
            xhr.overrideMimeType("text/plain; charset=utf-8");
        },
        success: function(json) {
            if(window.conf == 0){
                setTimeout(function(){
                    callback("success", json);
                }, 1000)
            }else{
                callback("success", json);
            }
        },
        error: function(e) {
            if(e.statusText == 'timeout'){
                callback("error", {"rtnCode": "-100", "rtnMsg": "连接超时！"});
                mui.alert("连接超时，请检查网络！");
            }else{
                callback("error", null);
                mui.alert("网络连接错误，请稍后再试！");
            }
        }
    });
}
$.getUrlVars = function(){
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
      hash = hashes[i].split('=');
      vars.push(hash[0]);
      vars[hash[0]] = hash[1];
    }
    return vars;
}
$.getUrlVar = function(name){
    return $.getUrlVars()[name];
}
/*
    handlebars扩展
    eg:
	$('#content').temp( $('#template'),  { name: "Alan" } );
	$('#content').temp( 'string' ,  { name: "Alan" } );
*/
;(function($){
    var compiled = {};
    $.fn.temp = function(template, data) {
        if(template instanceof jQuery){
            template = template.val();
        }
	    compiled[template] = Handlebars.compile(template);
	    this.html(compiled[template](data));
	    return this;
    };

    $.fn.tempAppend = function(template, data) {
        if(template instanceof jQuery){
            template = template.val();
        }
	    compiled[template] = Handlebars.compile(template);
	    this.append(compiled[template](data));
	    return this;
    };
    
    $.fn.tempPrepend = function(template, data) {
        if(template instanceof jQuery){
            template = template.val();
        }
	    compiled[template] = Handlebars.compile(template);
	    this.prepend(compiled[template](data));
	    return this;
    };
})(jQuery);
window.Util = {};
Util.lStorage = {
    /*
    localStorage只支持字符串，如果要放json，请先使用JSON.stringify()转换
    读取使用JSON.parse()读取
    */
    setParam: function(name, value) {
        localStorage.setItem(name, value);
    },
    getParam: function(name) {
        return localStorage.getItem(name);
    },
    removeParam:function(name){
        localStorage.removeItem(name);
    },
    clearParam:function(){
        //清除所有的存储，谨慎使用
        localStorage.clear();
    },
    paramSize:function(){
        return localStorage.length;
    },
    /*
        离线缓存管理器
    */
    cacheManager:new CacheManager(window.cacheCfg)
}

Util.sStorage = {
    /*
    sessionStorage只支持字符串，如果要放json，请先使用JSON.stringify()转换
    读取使用JSON.parse()读取
    */
    setParam: function(name, value) {
        sessionStorage.setItem(name, value);
    },
    getParam: function(name) {
        return sessionStorage.getItem(name);
    },
    removeParam:function(name){
        sessionStorage.removeItem(name);
    },
    clearParam:function(){
        //清除所有的存储，谨慎使用
        sessionStorage.clear();
    },
    paramSize:function(){
        return sessionStorage.length;
    }
}
/*
    离线缓存管理器
*/
function CacheManager(config){
    this.config=config;
}
/*
    从离线缓存中获取数据,当前方法有两个功能：
    1、从后台获取数据，第二个参数是一个回调函数，
    当离线缓存中没有要获取的数据时 或 当请求后台的入参值改变时，
    调用update方法从后台获取新数据，并覆盖旧数据
    2、获取本地插入的数据，第二个参数是一个字符串，
    当离线缓存中没有数据时直接返回空
*/
CacheManager.prototype.get=function(name,callback,param){
    var target=this.config[name];
    var cacheKey=target.key;
    var json=Util.lStorage.getParam(cacheKey);
    //当callback是方法时，表示从后台获取数据，需要使用回调处理数据
    if(typeof callback == 'function'&&target['url']){
        //realTime是在config对象中配置，
        //如果realTime配置true,表示每次都从后台取数据
        if(json&&!target.realTime){
            json=JSON.parse(json);
            if(json.param==param){
                callback('success',json);
                return;
            }
        }
        this.update(name,callback,param);
        return;
    }else{
        //callback不是方法的时候，即时返回数据
        return json;
    }
}
CacheManager.prototype.update=function(name,callback,param){
    var target=this.config[name];
    var cacheKey=target.key;
    //当callback是方法时，表示从后台刷新数据
    if(typeof callback == 'function'&&target.url){
        var _self = this;
        $.PostJson(target.url,param,function(state,json){
            if(state=='success'&&json.returnCode=='0'){
                json.param=param;
                Util.lStorage.setParam(cacheKey,JSON.stringify(json));
            }else{
                _self.del(name);
            }
            callback(state,json);
        },true);
    }else{
        //此时callback是字符串
        Util.lStorage.setParam(cacheKey,callback);
    }
}
CacheManager.prototype.del=function(name){
    var target=this.config[name];
    var cacheKey=target.key;
    Util.lStorage.removeParam(cacheKey);
}
CacheManager.prototype.clearAll=function(){
    for(var attr in this.config){
        var target=this.config[attr];
        var cacheKey=target.key;
        Util.lStorage.removeParam(cacheKey);
    }
}

var NiceTools = {
    /*
     * 功能:删除数组元素.
     * 参数:dx删除元素的下标.
     * 返回:在原数组上删除后的数组
     */
    removeByIndex : function(arrays , dx){
        if(isNaN(dx)||dx>arrays.length){return false;}
        for(var i=0,n=0;i<arrays.length;i++)
        {
            if(arrays[i]!=arrays[dx])
            {
                arrays[n++]=arrays[i]
            }
        }
        arrays.length-=1
        return arrays;
    },
    //删除指定的item,根据数组中的值
    removeByValue : function(arrays, item ){
        for( var i = 0 ; i < arrays.length ; i++ ){
            if( item == arrays[i] )
            {
                break;
            }
        }
        if( i == arrays.length ){
            return;
        }
        for( var j = i ; j < arrays.length - 1 ; j++ ){
            arrays[ j ] = arrays[ j + 1 ];
        }
        arrays.length--;
        return arrays;
    }
}

//阻止事件冒泡
function stopEvent(e){
    if(e && e.stopPropagation ){
        e.stopPropagation();
    }else{
        window.event.cancelBubble = true;
    }
}

/**
 * 设置当前时间为默认时间
 * type为true表示带时分秒
**/
function setCurDate(obj, type){
    var cDate = new Date();
    cDate = getCurDate(cDate, type);
    obj.val(cDate);
    obj.blur(function(){
        if(!obj.val()){
            setCurDate(obj, type);
        }
    })
}
/**
 * 设置当前时间为默认时间往前
 * type为true表示带时分秒
 * day 表示天数
**/
function setCurDateBefore(obj, day, type){
    var cDate = new Date().getTime();
    cDate = cDate - (parseInt(day, 10) * 24 * 60 * 60 * 1000);
    cDate = getCurDate(new Date(cDate), type);
    obj.val(cDate);
    obj.blur(function(){
        if(!obj.val()){
            setCurDateBefore(obj, day, type);
        }
    })
}
/**
 * 设置某个时间前后区间
 * type为true表示带时分秒
 * day 表示天数
**/
function getDateArea(cDate, day, type){
    var cDate = new Date().getTime();
    if(type){
        //往前
        cDate = cDate - (parseInt(day, 10) * 24 * 60 * 60 * 1000);
    }else{
        //往后
        cDate = cDate + (parseInt(day, 10) * 24 * 60 * 60 * 1000);
    }
    cDate = getCurDate(new Date(cDate));
    return cDate;
}
/**
 * 获取当前时间
 * type为true表示带时分秒
**/
function getCurDate(cDate, type){
    if(type && type == '2'){
        cDate = cDate.formatDD( "yyyy-MM-DD hh:mm:ss");
    }else if(type){
        cDate = cDate.formatDD( "yyyy-MM-DD hh:mm");
    }else{
        cDate = cDate.formatDD( "yyyy-MM-DD");
    }
    return cDate;
}
Date.prototype.formatDD = function( formatStr){ 
    var date = this;
    var str = formatStr; 
    str=str.replace(/yyyy|YYYY/,date.getFullYear()); 
    str=str.replace(/yy|YY/,(date.getYear() % 100)>9?(date.getYear() % 100).toString():"0" + (date.getYear() % 100)); 
    str=str.replace(/MM/,date.getMonth()>8?(date.getMonth()+1).toString():"0" + (date.getMonth()+1)); 
    str=str.replace(/M/g,date.getMonth()+1); 
    str=str.replace(/dd|DD/,date.getDate()>9?date.getDate().toString():"0" + date.getDate()); 
    str=str.replace(/d|D/g,date.getDate()); 
    str=str.replace(/hh|HH/,date.getHours()>9?date.getHours().toString():"0" + date.getHours()); 
    str=str.replace(/h|H/g,date.getHours()); 
    str=str.replace(/mm/,date.getMinutes()>9?date.getMinutes().toString():"0" + date.getMinutes()); 
    str=str.replace(/m/g,date.getMinutes()); 
    str=str.replace(/ss|SS/,date.getSeconds()>9?date.getSeconds().toString():"0" + date.getSeconds()); 
    str=str.replace(/s|S/g,date.getSeconds()); 
    return str; 
}
/**
 * 毫秒转日期
 *format(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss')
**/
var format = function(time, format){
    var t = new Date(time);
    var tf = function(i){return (i < 10 ? '0' : '') + i};
    return format.replace(/yyyy|MM|dd|HH|mm|ss/g, function(a){
        switch(a){
            case 'yyyy':
                return tf(t.getFullYear());
                break;
            case 'MM':
                return tf(t.getMonth() + 1);
                break;
            case 'mm':
                return tf(t.getMinutes());
                break;
            case 'dd':
                return tf(t.getDate());
                break;
            case 'HH':
                return tf(t.getHours());
                break;
            case 'ss':
                return tf(t.getSeconds());
                break;
        }
    })
}
//加法
function accAdd(arg1,arg2){
    var r1,r2,m;
    try{r1=arg1.toString().split(".")[1].length}catch(e){r1=0}
    try{r2=arg2.toString().split(".")[1].length}catch(e){r2=0}
    m=Math.pow(10,Math.max(r1,r2))
    return (arg1*m+arg2*m)/m;
}
//减法
function Subtr(arg1,arg2){
    var r1,r2,m,n;
    try{r1=arg1.toString().split(".")[1].length}catch(e){r1=0}
    try{r2=arg2.toString().split(".")[1].length}catch(e){r2=0}
    m=Math.pow(10,Math.max(r1,r2));
    n=(r1>=r2)?r1:r2;
    return ((arg1*m-arg2*m)/m).toFixed(n);
}
//说明：javascript的乘法结果会有误差，在两个浮点数相乘的时候会比较明显。这个函数返回较为精确的乘法结果。  
function zuiaccMul(arg1,arg2) {  
    var m=0,s1=arg1.toString(),s2=arg2.toString();  
    try{m+=s1.split(".")[1].length}catch(e){}  
    try{m+=s2.split(".")[1].length}catch(e){}  
    return Number(s1.replace(".",""))*Number(s2.replace(".",""))/Math.pow(10,m);  
}  

//除法函数，用来得到精确的除法结果  
//说明：javascript的除法结果会有误差，在两个浮点数相除的时候会比较明显。这个函数返回较为精确的除法结果。  
//调用：accDiv(arg1,arg2)  
//返回值：arg1除以arg2的精确结果  
function zuiaccDiv(arg1,arg2){  
    var t1=0,t2=0,r1,r2;  
    try{t1=arg1.toString().split(".")[1].length}catch(e){}  
    try{t2=arg2.toString().split(".")[1].length}catch(e){}  
    with(Math){  
        r1=Number(arg1.toString().replace(".",""));  
        r2=Number(arg2.toString().replace(".",""));  
        return (r1/r2)*pow(10,t2-t1);  
    }  
}

mui.plusReady(function(){
	
	//清除本地存储
	$("#J_clearLstorage").on("tap", function(){
		var loginPage = plus.webview.getWebviewById('login.html');
		Util.lStorage.clearParam();
		mui.fire(loginPage, "resetInput", {"reset": "true"});
		mui.openWindow({
			id: 'login.html',
			url: 'login.html',
			show: {
				aniShow: 'pop-in'
			},
			waiting: {
				autoShow: false
			}
		});
	})
	
})

//获取用户信息JSON
Util.getlSUserInfo = function(){
	/*	{
	    "id": "697B11DE6F854972AFC17A5AD61ABFC8",
	    "name": "汇仁堂大药房福州路店",
	    "address": "南昌市福州路28号奥林匹克大厦",
	    "districtid": "C0BE0735291411E5830200155D6EFA0F",
	    "district": null,
	    "cityid": null,
	    "city": null,
	    "provinceid": null,
	    "province": null,
	    "idno": null,
	    "contacts": "熊国庆",
	    "tel": "13007236414",
	    "xaxis": null,
	    "yaxis": null,
	    "gesture": null,
	    "gestureflag": null,
	    "price": null,
	    "token": "14B68425F4FB4CDFAB48F7FD6BD68B94"
	}*/
	var userinfo = Util.lStorage.getParam("userInfo") || "";
	if(userinfo)
		return JSON.parse(userinfo);
	else
		return null;
}

zuiopenW = function(param){
	var aniShow = mui.os.plus ? "slide-in-right" : "zoom-fade-out";
	var opt = {
		url: "",
		id: "",
		styles: {
			popGesture: "close",
			statusbar: {
				background: "#f7f7f7"
			}
		},
		extras:{
	        
		},
		show: {
			aniShow: aniShow,
			duration: 300
		}
	}
	var _param = $.extend({}, opt, param);
	mui.openWindow(_param);
}

function createLoading(txt){
    var _txt = txt || '正在努力加载数据...';
    if(!$(".zui-loading").length){
        $("body").append('<div class="zui-loading-bg"></div><div class="zui-loading fn-loading"><span class="load"></span>'+_txt+'</div>');
    }else{
    	$(".zui-loading").css({"display": "block"}).html('<span class="load"></span>'+_txt);
    	$(".zui-loading-bg").css({"display": "block"});
    }
    var _w = $(".zui-loading").width() + 20,
    	_h = $(".zui-loading").height() + 20;
    $(".zui-loading").css({"marginLeft": -_w/2, "marginTop": -_h/2});
}

function unblockLoading(){
    if($(".zui-loading").length)
        $(".zui-loading, .zui-loading-bg").css({"display": "none"});
}

function clearNoNum(obj, type){
    if(type){
		obj.value = obj.value.replace(/[^\d.]/g,"");  //清除“数字”和“.”以外的字符  
        obj.value = obj.value.replace(/\.{2,}/g,"."); //只保留第一个. 清除多余的  
        obj.value = obj.value.replace(".","$#$").replace(/\./g,"").replace("$#$","."); 
        if(type == '1'){
            obj.value = obj.value.replace(/^(\-)*(\d+)\.(\d).*$/,'$1$2.$3');//只能输入一位小数
        }else if(type == '2'){
            obj.value = obj.value.replace(/^(\-)*(\d+)\.(\d{2}).*$/,'$1$2.$3');//只能输入两个小数
        }else if(type == '3'){
            obj.value = obj.value.replace(/^(\-)*(\d+)\.(\d{3}).*$/,'$1$2.$3');//只能输入三位小数
        }
        //以上已经过滤，此处控制的是如果没有小数点，首位不能为类似于 01、02的金额
        if(obj.value.indexOf(".")< 0 && obj.value !=""){ 
            obj.value= parseFloat(obj.value); 
        }
        //控制.开头的数字，如：.8798321
        // \.16513000.546
        if(!obj.value.split(".")[0]){
            obj.value = '0.'+(obj.value.split(".")[1]||'');
            clearNoNum(obj);
        }
    }else{
        // 限制输入正整数
        obj.value = obj.value.replace(/[^\d]/g,"") || 1;
    }
}