window.onload=function(){
	//接受url的值,进行解析
	//接受url的值,进行解析
	function getParams(key) {
	    var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)");
	    var r = window.location.search.substr(1).match(reg);
	    if (r != null) {
	        return unescape(r[2]);
	    }
	    return null;
	};
	var deviceid=decodeURI(getParams("id"));	
	//1.需要先登录，获取sessionID,
	//2.通过查询1个小时的状态
	//3.画chart
	//4.连接websockt
	//更新数据
	var serverHttpIp="www.genetek.cc";
	var java_url="https://"+serverHttpIp+":8083/firectrl/client/";
	var stationUser_url="https://"+serverHttpIp+":8083/common/client/";
	var iotwsServer="wss://"+serverHttpIp+":8083/ClientWebSocket";
	var sessionId="";
	var	gasjyInfoArr=[];//保存数据
	var gasjyFlag=0;//判断调用的接口
	var getgasjystatuscountObj={};//用来保存调用查询气体状态数量与列表
	var switchGasjyValue="oxygen";//用来判断当前是什么值,默认是温度
	// 基于准备好的dom，初始化echarts实例
    var gasjyCurrentChart = echarts.init(document.getElementById('gasjyCurrentChart'));
    var chartIndex=0;
    
	var loginObj={
		"name":"test003",
		"password":hex_md5("123456")
	};
	loginRequest(loginObj);
	function loginRequest(obj){
		$.ajax({
			url:stationUser_url+"user/login",
			type:"post",
			dataType:"json",
			contentType:"application/json;charset=utf-8",
			data:JSON.stringify(obj),
			success:function(data){
				
				getLoginInfo(data);
			},
			error:function(e){
				console.log(e);
			}
		})
	}
	
	function getsensor(){
		var obj={
			"deviceid":deviceid
		}
		$.ajax({
			url:java_url+"getsensor",
			type:"post",
			dataType:"json",
			headers: {
				"Content-Type": "application/json;charset=utf-8",
				"Authorization": sessionId
			},
			data:JSON.stringify(obj),
			success:function(data){
				var code=data["code"];
				if(code==0){
					var address=data["data"]["address"];
					$(".gasjyTop>p:nth-child(2)>span:nth-child(2)").html(deviceid);
					$(".gasjyTop>p:nth-child(3)>span:nth-child(2)").html(address);
				}
				//再去获取设备信息
				var currentStart=getTheCurrentTime((new Date().getTime())-(1000*60*60));
				var currentEnd=getTheCurrentTime("");	
				refreshgasjyDeviceData(currentStart,currentEnd);
			},
			error:function(e){
				console.log(e);
			}
		})
	}
	
	function getLoginInfo(data){
		var code=data["code"];
		if(code==0){
			sessionId=data["data"]["session"];
			getsensor();
			/*开始物联网的websocket*/
			stationWebsocket();
		}
	}
	
	function  getPowerDeviceTime(start,end){
		return {
			"deviceid":deviceid,
			"start":start,
			"end":end
		}
	}
	
	function refreshgasjyDeviceData(start,end){
		getgasjystatuscountObj=getPowerDeviceTime(start,end);
		gasjyFlag=0;
		sendgasjyInfoHttps(java_url +"sensor/gassensor/getstatuscount",getgasjystatuscountObj);
	}
	
	
	function sendgasjyInfoHttps(url,obj){
		$.ajax({
			url:url,
			type: "post",
			dataType: "json",
			async:false,
			headers: {
				"Content-Type": "application/json;charset=utf-8",
				"Authorization": sessionId
			},
			data: JSON.stringify(obj),
			success: function(resData) {
				sendgasjyInfoCallBack(resData);
			},
			error:function(e){
				console.log(e);
			}
		});
	}
	
	function sendgasjyInfoCallBack(resData){
		switch (gasjyFlag){
			case 0:
				getgasjystatuscount(resData);
				break;
			case 1:
				getgasjystatuslist(resData);
				break;
			default:
				break;
		}
	}
	
	//查询气体状态数量
	function getgasjystatuscount(resData){	
		var code = resData["code"];
		if(code == 0) {
			//emptyLineData();
			var count=resData["data"]["count"];
			if(count!=0){
				gasjyFlag=1;	
				var number=2000;
				var page=Math.ceil(count/number);
				for(var i=0;i<page;i++){
					getgasjystatuscountObj["pagesize"]=number
					getgasjystatuscountObj["pageindex"]=i;
					sendgasjyInfoHttps(java_url +"sensor/gassensor/getstatuslist",getgasjystatuscountObj);
				}	
			}
			var typeName=getGasjytypeName(switchGasjyValue);
			createChartDate(switchGasjyValue,typeName);
			chartIndex++;
		}
	}
	
	
	
	
	//查询气体状态列表
	function getgasjystatuslist(resData){
		var code=resData["code"];
		if(code==0){
			var gasjyData=resData["data"];
			for(var i=0;i<gasjyData.length;i++){
				gasjyData[i]["timestamp"]=gasjyData[i]["timestamp"].replace(/-/g,"/")
				gasjyInfoArr.push(gasjyData[i]);
			}
			//显示最新的一条数据
			if(gasjyInfoArr.length!=0){
				var gasjyDataEndData=gasjyInfoArr[gasjyInfoArr.length-1];
				showgasjyData(gasjyDataEndData);
			}
		}
	}
	
	//显示线路的具体数据
	function showgasjyData(gasjyData){
		var oxygen=gasjyData["oxygen"];//氧气
		var ex=gasjyData["ex"];//可燃气体
		var co=gasjyData["co"];//一氧化碳
		var hepatic=gasjyData["hepatic"];//硫化氢
		var power=gasjyData["power"];//电量
		var currentTimestamp=gasjyData["timestamp"];//时间戳
		
		$(".gasjyNav>div:nth-child(1)>span:nth-child(3)").html(oxygen+"(ppm)");
		$(".gasjyNav>div:nth-child(2)>span:nth-child(3)").html(ex+"(ppm)");
		$(".gasjyNav>div:nth-child(3)>span:nth-child(3)").html(co+"(ppm)");
		$(".gasjyNav>div:nth-child(4)>span:nth-child(3)").html(hepatic+"(ppb)");
		$(".gasjyTop>p:nth-child(4)>span:nth-child(2)").html(power+"%");
		$(".gasjyTop>p:nth-child(5)>span:nth-child(2)").html(currentTimestamp);
		
		var airFlag=0;	
		var border="border";
		var alarmColor="2px solid #D81E06";
		var normalColor="1px solid #fff";
		if(oxygen>23.5){
			airFlag+=5;
			$(".gasjyNav>div:nth-child(1)").css(border,alarmColor);
			$(".gasjyNav>div:nth-child(1)>img").attr("src","images/oxygenDanger.png");
		}else if(oxygen<19.5){
			airFlag+=5;
			$(".gasjyNav>div:nth-child(1)").css(border,alarmColor);
			$(".gasjyNav>div:nth-child(1)>img").attr("src","images/oxygenDanger.png");
		}else{
			$(".gasjyNav>div:nth-child(1)").css(border,normalColor);
			$(".gasjyNav>div:nth-child(1)>img").attr("src","images/oxygen.png");
		}
		
		if(ex>50){
			airFlag+=5;
			$(".gasjyNav>div:nth-child(2)").css(border,alarmColor);
			$(".gasjyNav>div:nth-child(2)>img").attr("src","images/exDanger.png");
			
		}else{
			$(".gasjyNav>div:nth-child(2)").css(border,normalColor);
			$(".gasjyNav>div:nth-child(2)>img").attr("src","images/ex.png");
		}
		
		if(co>50){
			airFlag+=5;
			$(".gasjyNav>div:nth-child(3)").css(border,alarmColor);
			$(".gasjyNav>div:nth-child(3)>img").attr("src","images/coDanger.png");
		}else{
			$(".gasjyNav>div:nth-child(3)").css(border,normalColor);
			$(".gasjyNav>div:nth-child(3)>img").attr("src","images/co.png");
		}
		
		if(hepatic>10){
			airFlag+=5;
			$(".gasjyNav>div:nth-child(4)").css(border,alarmColor);
			$(".gasjyNav>div:nth-child(4)>img").attr("src","images/hepaticDanger.png");
		}else{
			$(".gasjyNav>div:nth-child(4)").css(border,normalColor);
			$(".gasjyNav>div:nth-child(4)>img").attr("src","images/hepatic.png");
		}
		
		if(airFlag>=5){
			var img="images/danger.png"
			var name="危险";
		}else{
			var img="images/security.png"
			var name="安全";	
		}
		var p="<p><img src='"+img+"'></p>"
		+"<p><span>"+name+"</span></p>"
		$(".gasjyLevel").html(p);
	}
	
	function showCurrentDay(){
		var currentTime = new Date();
		var year = currentTime.getFullYear();
		var getMonth = (currentTime.getMonth()) + 1;
		var getDate = currentTime.getDate();
		var getHours = currentTime.getHours();
		var getMinutes = currentTime.getMinutes();
		var getSeconds = currentTime.getSeconds();
		if(getMonth < 10) {
			getMonth = "0" + getMonth;
		}
		if(getDate < 10) {
			getDate = "0" + getDate;
		}
		return year + "/" + getMonth + "/" + getDate;
	}

	
	function getTheCurrentTime(data){//这里需要给秒数
		if(data.length==0){
			var currentTime = new Date();
		}else{
			var currentTime = new Date(data);
		}
		var year = currentTime.getFullYear();
		var getMonth = (currentTime.getMonth()) + 1;
		var getDate = currentTime.getDate();
		var getHours = currentTime.getHours();
		var getMinutes = currentTime.getMinutes();
		var getSeconds = currentTime.getSeconds();
		if(getMonth < 10) {
			getMonth = "0" + getMonth;
		}
		if(getDate < 10) {
			getDate = "0" + getDate;
		}
		if(getHours < 10) {
			getHours = "0" + getHours;
		}
		if(getMinutes < 10) {
			getMinutes = "0" + getMinutes;
		}
		if(getSeconds < 10) {
			getSeconds = "0" + getSeconds;
		}
		return year + "/" + getMonth + "/" + getDate + " " + getHours + ":" + getMinutes + ":" + getSeconds;
	}	
	
	var timeMinutePoint=[];
	resTimePointAndtimeMinutePoint();
	function resTimePointAndtimeMinutePoint(start,end){
		timeMinutePoint=[];
		var currentTimeStamp=Date.parse(new Date())/1000;
		for(var i=0;i<7;i++){	
			if(i==0){
				var time=getTheCurrentTime(currentTimeStamp*1000);
			}else{
				var time=getTheCurrentTime((currentTimeStamp-(i*600*12))*1000);
			}	
			var formatTime=time.slice(11,16);//页面显示的时间段	
			timeMinutePoint.unshift(formatTime);
		}
	}
	function createChartDate(type,name){
		var gasjyArr=[];
		var timeArr=[];
		for(var i=0;i<gasjyInfoArr.length;i++){
			var typeValue=gasjyInfoArr[i][type];
			var timestamp=gasjyInfoArr[i]["timestamp"].slice(11,16);
			gasjyArr.push(typeValue);
			timeArr.push(timestamp);
		}
		var gasjyCurrentOption=getOptionData(name,"#C23531",gasjyArr,timeArr);
		gasjyCurrentChart.setOption(gasjyCurrentOption);
	}
	
	$(".gasjyNav>div").click(function(){
		var value=$(this).attr("type");
		$(this).addClass("selectCls").siblings("div").removeClass();
		var typeName=getGasjytypeName(value);
		switchGasjyValue=value;
		createChartDate(value,typeName);
	})
	
	
	
	
	function stationWebsocket(){
		var rollCall_websocket = new WebSocket(iotwsServer);
		rollCall_websocket.onopen = function (evt) {
			console.warn("物联网连接成功");
			var messageObj = {
				"msgcode":100,
				"msgname":"session",
				"message":sessionId
			}
			var msg = JSON.stringify(messageObj );
			rollCall_websocket.send(msg);
		};
				
		rollCall_websocket.onclose = function (evt) {
			stationWebsocket();//连接断开，重新连接
			console.log("iotWebsocket Disconnected");
		};
				
		rollCall_websocket.onmessage = function (evt) {	
			var data=JSON.parse(evt.data);
			var msgcode=data["msgcode"];
			var message=data["message"];
			console.log(message);
			switch(msgcode){
				case 1017:
					updategasjyDeviceStatus(message);
					break;
				default:
					break;
			}
		}
	}
	
	
	/*setInterval(function(){
		var message=[
			{
				"timestamp":new Date().getTime(),
				"oxygen":100,
				"ex":0,
				"co":1000,
				"hepatic":100,
				"power":100,
				"deviceid":deviceid
			}
		]
		updategasjyDeviceStatus(message);
	},4000)
	
	setInterval(function(){
		var message=[
			{
				"timestamp":new Date().getTime(),
				"oxygen":21,
				"ex":0,
				"co":0,
				"hepatic":0,
				"power":100,
				"deviceid":deviceid
			}
		]
		updategasjyDeviceStatus(message);
	},8000)*/
	
	
	function updategasjyDeviceStatus(message){
		for(var i=0;i<message.length;i++){	
			var id=message[i]["deviceid"];
			if(id==deviceid){	
				if(gasjyInfoArr.length>=2000){
					gasjyInfoArr.shift();
				}
				message[i]["timestamp"]=getTheCurrentTime(message[i]["timestamp"]);
	   			gasjyInfoArr.push(message[i]);
	   			var typeName=getGasjytypeName(switchGasjyValue);
	   			createChartDate(switchGasjyValue,typeName);	
				showgasjyData(message[i]);
			}
		}
	}
	
	function getGasjytypeName(type){
		switch(type){
			case "oxygen":
				return "氧气(ppm)";
				break;
			case "ex":
				return "可燃气体(ppm)";
				break;
			case "co":
				return "一氧化碳(ppm)";
				break;
			case "hepatic":
				return "硫化氢(ppb)";
				break;
			default:
				break;
		}
	}
	
	
	
	$(window).resize(function(){
	   //根据不同的尺寸,刷新图表 
		gasjyCurrentChart.resize();
	});
	
	
	function getOptionData(yName,color,data,time){
		return {
			title:{
				textStyle: {
                        fontWeight: 'normal',             
                        color: '#A3FFFC'  //标题颜色
                },
			},
			tooltip: {
	        	trigger: 'axis',
	        	formatter: function (params) {
		            var xData=params[0]["value"];
		            var axisValue=params[0]["axisValue"];
		            return "时间:"+axisValue+"<br/><span style='width:12px;height:12px;float:left;background:"+color+";border-radius:50%;margin:5px 5px 5px 0;'>"
		            +"</span>"+yName+":"+xData;
		        },
		     
	    	},
			xAxis: {
			    type: 'category',
			    boundaryGap: false,
				data: time,
				axisLine:{
		       		lineStyle:{
		       			color: '#1AB394',
		       		}
	        	}
			},
			yAxis: {
			    type: 'value',
			    name:yName,
		        boundaryGap: [0,'100%'],
			    nameTextStyle:{
		           fontSize:14,
		           color:"#fff"
		       },   
				axisLine:{
		       		lineStyle:{
		       			color: '#1AB394',
		       			 align:"center",
		       		}
	        	}  
			},
			grid: {
			    left:"15%"
			},
			series: [{
			    data: data,
			    type: 'line',
			    
			}],
			color:[color]
		};
	}
	
	
}