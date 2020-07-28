$().ready(function() {
	/*****************************获取登录以后的信息*****************************/
	var sessionId = sessionStorage.getItem("sessionId"); //session
	var usertype = sessionStorage.getItem("usertype"); //获取权限
	var username=sessionStorage.getItem("username");
	var password=sessionStorage.getItem("password");
	var levelvalue=sessionStorage.getItem("levelvalue");
	var scopelevel=sessionStorage.getItem("scopelevel");
	var addr_longitude=sessionStorage.getItem("addr_longitude");
	var addr_latitude=sessionStorage.getItem("addr_latitude");
	var city=sessionStorage.getItem("city");
	
	// 基于准备好的dom，初始化echarts实例
    var gasjyCurrentChart = echarts.init(document.getElementById('gasjyCurrentChart'));
    var chartIndex=0;
	
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
	var deviceAddress=decodeURI(getParams("name"));
	var currentStation=decodeURI(getParams("currentStation"));
	var	gasjyInfoArr=[];//保存数据
	var gasjyFlag=0;//判断调用的接口
	var getgasjystatuscountObj={};//用来保存调用查询气体状态数量与列表
	var switchGasjyValue="temperature";//用来判断当前是什么值,默认是温度
	
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
	var currentStart=showCurrentDay()+" 00:00:00";
	var currentEnd=getTheCurrentTime("");	
	refreshgasjyDeviceData(currentStart,currentEnd);
	
	setDeviceDetail();
	function setDeviceDetail(){
		$(".deviceDetail>p:nth-child(1)>span:nth-child(2)").html(currentStation);
		$(".deviceDetail>p:nth-child(2)>span:nth-child(2)").html(deviceid);
		$(".deviceDetail>p:nth-child(3)>span:nth-child(2)").html(deviceAddress);
		var time=showCurrentDay();
		$(".main_right>div:nth-child(1)>input").val(time);
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
			emptyLineData();
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
			switchGasjyValue="temperature";
			createChartDate("temperature","温度(℃)")
			chartIndex++;
			showExpectionMessage();//显示异常记录
		}
	}
	
	//查询气体状态列表
	function getgasjystatuslist(resData){
		var code=resData["code"];
		if(code==0){
			var gasjyData=resData["data"];
			for(var i=0;i<gasjyData.length;i++){
				gasjyData[i]["temperature"]=parseFloat(gasjyData[i]["temperature"]/10);
				gasjyData[i]["humidity"]=parseFloat(gasjyData[i]["humidity"]/10);
				gasjyInfoArr.push(gasjyData[i]);
			}
			//显示最新的一条数据
			if(gasjyInfoArr.length!=0){
				var gasjyDataEndData=gasjyInfoArr[gasjyInfoArr.length-1];
				showgasjyData(gasjyDataEndData);
			}
		}
	}
	
	function emptyLineData(){
		var optionName=["温度","湿度","pm25","pm10","二氧化碳","甲醛","挥发性有机物"];
		var optionValue=["temperature","humidity","pm25","pm10","co2","ch2o","tvoc"];
		var option="";
		for(var i=0;i<optionName.length;i++){
			option+="<option value='"+optionValue[i]+"'>"+optionName[i]+"</option>"
		}
		console.log(option);
		$(".routeSelection>form>select").html(option);
		
		$(".routerWrap>div:nth-child(1)>p:nth-child(1)>span:nth-child(2)").html("");
		$(".routerWrap>div:nth-child(2)>p:nth-child(1)>span:nth-child(2)").html("");
		$(".routerWrap>div:nth-child(3)>p:nth-child(1)>span:nth-child(2)").html("");
		$(".routerWrap>div:nth-child(4)>p:nth-child(1)>span:nth-child(2)").html("");
		$(".routerWrap>div:nth-child(5)>p:nth-child(1)>span:nth-child(2)").html("");
		$(".routerWrap>div:nth-child(6)>p:nth-child(1)>span:nth-child(2)").html("");
		$(".routerWrap>div:nth-child(7)>p:nth-child(1)>span:nth-child(2)").html("");
		$(".deviceTime>span:nth-child(2)").html("");
		gasjyInfoArr=[];
		if(chartIndex>=2){
			gasjyCurrentChart.setOption({
		        series: [{
		            data: []
		        }]
		    });
		}	
	}
	
	var layuiForm,layuidate,layuier;
	showSelectLayui();
	function showSelectLayui(){
		layui.use(['form','laydate','layer'], function(){
			layuiForm = layui.form;
			layuidate = layui.laydate;
			layuier = layui.layer;
			//常规用法
			layuidate.render({
			    elem: '#test',
			    done: function(value, date){
			       var start=value+" "+"00:00:00";
			       var end=value+" "+"23:59:59";
			       refreshgasjyDeviceData(start,end);
                   layuiForm.render();
			       
			    }
			});
			
			layuiForm.render();
			layuiForm.on('select(line)', function(data){
				var value=data.value;
				var typeName=getGasjytypeName(value);
				switchGasjyValue=value;
				createChartDate(value,typeName);
			}) 
		});
	}

	function getGasjytypeName(type){
		switch(type){
			case "ch2o":
				return "甲醛(ppb)";
				break;
			case "tvoc":
				return "挥发性有机物(ppb)";
				break;
			case "pm25":
				return "pm25(微克/m3)";
				break;
			case "pm10":
				return "pm10(微克/m3)";
				break;
			case "co2":
				return "二氧化碳(ppm)";
				break;
			case "temperature":
				return "温度(℃)";
				break;
			case "humidity":
				return "湿度(%)";
				break;
			default:
				break;
		}
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
		return year + "-" + getMonth + "-" + getDate;
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
		return year + "-" + getMonth + "-" + getDate + " " + getHours + ":" + getMinutes + ":" + getSeconds;
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
		
		switch(type){
			case "ch2o":
				var min=0;	
				var max=100;
				var splitNumber=5;
				break;
			case "tvoc":
				var min=0;	
				var max=300;
				var splitNumber=10;
				break;
			case "pm25":
				var min=0;
				var max=300;
				var splitNumber=10;
				break;
			case "pm10":
				var min=0;
				var max=300;
				var splitNumber=10;
				break;
			case "co2":
				var min=0;
				var max=3000;
				var splitNumber=10;
				break;
			case "temperature":
				var min=-20;
				var max=80;
				var splitNumber=5;
				break;
			case "humidity":
				var min=0;
				var max=100;
				var splitNumber=5;
				break;
			default:
				var min=0;
				var max=2000;
				var splitNumber=10;
				break;
		}
		
		var gasjyCurrentOption=getOptionData(name,"#C23531",gasjyArr,timeArr,min,max,splitNumber);
		gasjyCurrentChart.setOption(gasjyCurrentOption);
	}

	
	$(window).resize(function(){
	   //根据不同的尺寸,刷新图表 
		gasjyCurrentChart.resize();
	});
	
	/*开始物联网的websocket*/
	stationWebsocket();
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
	
		
	function updategasjyDeviceStatus(message){
		for(var i=0;i<message.length;i++){	
			var currentTimestamp=message[i]["timestamp"];//时间戳
			var currentDay=$(".main_right>div:nth-child(1)>input").val();
			var startTime=currentDay+" 00:00:00";
			var endTime=currentDay+" 23:59:59";
			var startTimeStamp=new Date(startTime).getTime();
			var endTimeStamp=new Date(endTime).getTime();
			var id=message[i]["deviceid"];
			if(id==deviceid){
				if((currentTimestamp<=endTimeStamp)&&(currentTimestamp>=startTimeStamp)){	
					if(gasjyInfoArr.length>=2000){
						gasjyInfoArr.shift();
					}		
					message[i]["temperature"]=parseFloat(message[i]["temperature"]/10);
					message[i]["humidity"]=parseFloat(message[i]["humidity"]/10)
					message[i]["timestamp"]=getTheCurrentTime(message[i]["timestamp"]);
		   			gasjyInfoArr.push(message[i]);
		   			var typeName=getGasjytypeName(switchGasjyValue);
		   			createChartDate(switchGasjyValue,typeName);	
	   			}
				showgasjyData(message[i]);
			}
		}
	}
	
	
	//显示线路的具体数据
	function showgasjyData(gasjyData){
		var ch2o=gasjyData["ch2o"];//甲醛
		var tvoc=gasjyData["tvoc"];//可挥发气体
		var pm25=gasjyData["pm25"];//pm25
		var pm10=gasjyData["pm10"];//pm10
		var co2=gasjyData["co2"];//可然气体
		var temperature=parseFloat(gasjyData["temperature"]); //温度
		var humidity=parseFloat(gasjyData["humidity"]);//湿度
		var currentTimestamp=gasjyData["timestamp"];//时间戳
		var time=getTheCurrentTime(currentTimestamp);
		$(".routerWrap>div:nth-child(1)>p>span:nth-child(2)").html(temperature+"(℃)");
		$(".routerWrap>div:nth-child(2)>p>span:nth-child(2)").html(humidity+"(%)");
		$(".routerWrap>div:nth-child(3)>p>span:nth-child(2)").html(pm25+"(微克/m3)");
		$(".routerWrap>div:nth-child(4)>p>span:nth-child(2)").html(pm10+"(微克/m3)");
		$(".routerWrap>div:nth-child(5)>p>span:nth-child(2)").html(co2+"(ppm)");
		$(".routerWrap>div:nth-child(6)>p>span:nth-child(2)").html(ch2o+"(ppb)");
		$(".routerWrap>div:nth-child(7)>p>span:nth-child(2)").html(tvoc+"(ppb)");
		$(".deviceTime>span:nth-child(2)").html(time);
		var airFlag=0;
		if(pm25>200){
			airFlag+=5;
		}else{
			airFlag+=1;
		}
		
		if(pm10>150){
			airFlag+=5;
		}else{
			airFlag+=1;
		}
		
		if(co2>1200){
			airFlag+=5;
		}else{
			airFlag+=1;
		}
		
		if(ch2o>120){
			airFlag+=5;
		}else{
			airFlag+=1;
		}
		
		if(tvoc>500){
			airFlag+=5;
		}else{
			airFlag+=1;
		}
		if(airFlag>5){
			//改变当前的显示框变为红色
			$(".deviceImg>img").attr("src","images/cry.png");
			$(".deviceImg>span").html("差");
		}else{
			//恢复正常显示
			$(".deviceImg>img").attr("src","images/laugh.png");
			$(".deviceImg>span").html("优");
		}
	}
	
	function showExpectionMessage(){
		var ul="";
		for(var i=0;i<gasjyInfoArr.length;i++){
			var ch2o=gasjyInfoArr[i]["ch2o"];//甲醛
			var tvoc=gasjyInfoArr[i]["tvoc"];//可挥发气体
			var pm25=gasjyInfoArr[i]["pm25"];//pm25
			var pm10=gasjyInfoArr[i]["pm10"];//pm10
			var co2=gasjyInfoArr[i]["co2"];//可然气体
			var currentTimestamp=gasjyInfoArr[i]["timestamp"];//时间戳
			if(pm25>200){
				ul+="<ul>"
					+"<li>"+currentTimestamp+"</li>"
					+"<li>"+getGasjytypeName('pm25')+"</li>"
					+"<li>"+pm25+"(≤200)</li>"
				+"</ul>"
			}
			if(pm10>150){
				ul+="<ul>"
					+"<li>"+currentTimestamp+"</li>"
					+"<li>"+getGasjytypeName('pm10')+"</li>"
					+"<li>"+pm10+"(≤150)</li>"
				+"</ul>"
			}
			if(co2>1200){
				ul+="<ul>"
					+"<li>"+currentTimestamp+"</li>"
					+"<li>"+getGasjytypeName('co2')+"</li>"
					+"<li>"+co2+"(≤1200)</li>"
				+"</ul>"
			}
			if(ch2o>120){
				ul+="<ul>"
					+"<li>"+currentTimestamp+"</li>"
					+"<li>"+getGasjytypeName('ch2o')+"</li>"
					+"<li>"+ch2o+"(≤120)</li>"
				+"</ul>"
			}
			if(tvoc>500){
				ul+="<ul>"
					+"<li>"+currentTimestamp+"</li>"
					+"<li>"+getGasjytypeName('tvoc')+"</li>"
					+"<li>"+tvoc+"(≤500)</li>"
				+"</ul>"
			}
		}
		$(".powerAlarmHistory>div").html(ul);
	}
	
	function getOptionData(yName,color,data,time,min,max,splitNumber){
		console.log(yName)
		return {
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
		       			color: '#fff',
		       		}
	        	}
			},
			yAxis: {
			    type: 'value',
			    name:yName,
		        boundaryGap: [0,'100%'],
			    nameTextStyle:{
		           fontSize:18,
		           align:"left",
		           color:"#fff"
		        },
				axisLine:{
		       		lineStyle:{
		       			color: '#fff',
		       		}
	       	 	},
	       	 	min: min,
       			max: max,
       			splitNumber:splitNumber
			},
			series: [{
			    data: data,
			    type: 'line',
			    
			}],
			color:[color]
		};
	}
	
	
	
	
	
})