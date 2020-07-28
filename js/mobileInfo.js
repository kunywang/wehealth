window.onload=function(){	

	var userLoginSessionId = sessionStorage.getItem("sessionId"); //session
	var userLoginAddr = sessionStorage.getItem("addr"); //地理位置
	var userLoginType = sessionStorage.getItem("usertype"); //获取权限
	var userLoginName=sessionStorage.getItem("username");//用户登录名称
	var userLoginPassword=sessionStorage.getItem("password");//用户密码
	var levelvalue=sessionStorage.getItem("levelvalue");//用户登录所属值
	var scopelevel=sessionStorage.getItem("scopelevel");//用户登录所属组织
	var userLoginLongitude=sessionStorage.getItem("addr_longitude");//用户登录经度
	var userLoginLatitude=sessionStorage.getItem("addr_latitude");//用户登录纬度
	var userLoginCity=sessionStorage.getItem("city");//用户登录城市
	var userLoginPhone=sessionStorage.getItem("phone");//用户登录电话,用于对讲
	
	var stationBrigadeArr=[];//保存设备里面的支队
	var stationBoroughArr=[];//保存设备里面的大队
	var stationDetachmentArr=[];//保存设备里面的中队
	
	var brigadeHash={};//保存当前的支队
	var boroughHash={};//保存当前的大队
	var detachmentHash={};//保存当前的中队
	var	stationHashTable={};//保存所有设备的基本信息
	var iotHashTable={};//保存所有的物联网信息
	var callBackFlag=1;
	
	
	$(".nav>ul>li").click(function(){
		//导航菜单的切换
		var datalist=$(this).attr("data-list");
		navMenuSwitch(this,datalist)
	})
	function navMenuSwitch(that,datalist){
		$(datalist).css("display", "block").siblings().css("display", "none");
		$(that).children("span:nth-child(2)").addClass("optionCol");
		$(that).siblings("li").children("span:nth-child(2)").removeAttr("class");	
		$(that).parent().children("li:nth-child(1)").children("img").attr("src","images/index.png");
		//$(that).parent().children("li:nth-child(2)").children("img").attr("src","images/message.png")
		$(that).parent().children("li:nth-child(2)").children("img").attr("src","images/owner.png")
		var imgName=datalist.replace("#","");
		var src="images/"+imgName+"Option"+".png";
		$(that).children("img").attr("src",src);
	}
	
	function getCookie(cname){
	    var name = cname + "=";
	    var ca = document.cookie.split(';');
	    for(var i=0; i<ca.length; i++) {
	        var c = ca[i].trim();
	        if (c.indexOf(name)==0) { return c.substring(name.length,c.length); }
	    }
	    return "";
	}
	
	function delCookie(name)
	{
		var exp = new Date();
		exp.setTime(exp.getTime() - 1);
		var cval=getCookie(name);
		if(cval!=null)
		document.cookie= name + "="+cval+";expires="+exp.toGMTString();
	}
	
	$(".signOut").click(function(){
		delCookie("username");
		delCookie("password");
		window.location.href="mobile.html";
	})
	
	function httpResCallBack(data){
		switch(callBackFlag){
			case 1://获取所有的支队
				getBrigadeCallBack(data);
				break;
			case 2://获取所有的大队
				getBoroughCallBack(data);
				break;
			case 3://获取所有的中队
				getDetachmentCallBack(data);
				break;
			case 4://获取所有的单位的数量
				getStationCountCallBack(data);
				break;
			case 5://获取所有单位的详情 
				getStationListCallBack(data);
				break;
			case 6://获取传感器的数量
				querysensorcountCallBack(data);
				break;
			case 7://获取传感器的列表
				querysensorlistCallBack(data);
				break;
			default:
				break;
		}
	}
	
	function sendHttpSynRequest(url,data){//发送http同步请求
		$.ajax({
			url:url,
			type:"post",
			dataType:"json",
			async:false,
			data:JSON.stringify(data),
			headers:{
				"Content-Type":"application/json;charset=utf-8",
				"Authorization":userLoginSessionId
			},
			success:function(data){
				httpResCallBack(data);
			},
			error:function(e){
				console.error("网络超时，请重新登录");
			}
		})
	}
	
	//查询所有的支队
	sendHttpSynRequest(stationUser_url+"user/getbrigade","");
	function getBrigadeCallBack(data){
		console.log(data);
		var code=data["code"];
		if(code==0){
			var brigadeData=data["data"];
			var arrTemp=[];
			for(var i=0;i<brigadeData.length;i++){
				var brigade=brigadeData[i]["brigade"];	
				brigadeHash[brigade]=brigadeData[i];
				arrTemp.push(brigade);
			}
			callBackFlag=2;
			sendHttpSynRequest(stationUser_url+"user/getboroughofmultibrigade",arrTemp);	
		}else{
			httpResError();
		}
		
		//获取所有的中队
		var detachmentTempArr=[];
		for(var bor in boroughHash){
			detachmentTempArr.push(bor);
		}
		callBackFlag=3;	
		sendHttpSynRequest(stationUser_url+"user/getdetachmentofmultiborough",detachmentTempArr);	

		//获取所有的单位的数量
		callBackFlag=4;	
		var stationNumberData=getscopelevel();
		sendHttpSynRequest(java_url+"getstationcount",stationNumberData);	
	}
	
	function getBoroughCallBack(data){
		console.log(data);	
		var code=data["code"];
		if(code==0){
			var boroughData=data["data"];
			for(var i=0;i<boroughData.length;i++){
				var borough=boroughData[i]["borough"];
				boroughHash[borough]=boroughData[i];
			}
		}else{
			httpResError();
		}
	}

	function getDetachmentCallBack(data){
		var code=data["code"];
		if(code==0){
			var detachmentData=data["data"];
			for(var i=0;i<detachmentData.length;i++){
				var detachment=detachmentData[i]["detachment"];
				detachmentHash[detachment]=detachmentData[i];
			}
		}else{
			httpResError();
		}	
	}

	function getStationCountCallBack(data){
		var code=data["code"];
		if(code==0){
			var count=data["data"]["count"];
			if(count!=0){
				callBackFlag=5;	
				var stationNumberData=getscopelevel();
				var number=2000;
				var page=Math.ceil(count/number);
				for(var i=0;i<page;i++){
					stationNumberData["pagesize"]=number
					stationNumberData["pageindex"]=i;
					sendHttpSynRequest(java_url+"getstationlist",stationNumberData);	
				}
				
				//查询传感器数量
				querysensorcount();
			}
		}else{
			httpResError();
		}
	}
	
	function getStationListCallBack(data){
		var code=data["code"];
		if(code==0){
			var stationData=data["data"];
			for(var i = 0; i < stationData.length; i++) {
				var detachment = stationData[i]["detachment"];
				var brigade = stationData[i]["brigade"];
				var borough = stationData[i]["borough"];
				var latitude = stationData[i]["latitude"];
				var longitude = stationData[i]["longitude"];
				var name=stationData[i]["name"];
				//查找所有的支队
				if(stationBrigadeArr.indexOf(brigade)==-1){
					stationBrigadeArr.push(brigade);
				}
				//查找所有的大队
				if(stationBoroughArr.indexOf(borough) == -1) {
					stationBoroughArr.push(borough);
				}
				//查找所有的中队
				if(stationDetachmentArr.indexOf(detachment) == -1) {;
					stationDetachmentArr.push(detachment);
				}
				stationHashTable[name]=stationData[i];	
			}
		}else{
			httpResError();
		}
	}
	
	
	function querysensorcount(){
		callBackFlag=6;	
		var stationNumberData=getscopelevel();
		sendHttpSynRequest(java_url+"querysensorcount",stationNumberData);
		
	}
	
	function querysensorcountCallBack(data){
		var code=data["code"];
		if(code==0){
			var count=data["data"]["count"];
			if(count!=0){
				callBackFlag=7;	
				var stationNumberData=getscopelevel();
				var number=2000;
				var page=Math.ceil(count/number);
				for(var i=0;i<page;i++){
					stationNumberData["pagesize"]=number
					stationNumberData["pageindex"]=i;
					sendHttpSynRequest(java_url+"querysensorpage",stationNumberData);	
				}
				//显示列表
				showIotInfo();
				//连接websocket
				stationWebsocket();
			}
		}else{
			httpResError();
		}
	}
	
	function querysensorlistCallBack(data){
		var code=data["code"];
		if(code==0){
			var data=data["data"];
			for(var i=0;i<data.length;i++){
				var deviceid=data[i]["deviceid"];
				iotHashTable[deviceid]=data[i];
			}
		}	
	}
	
	function showIotInfo(){
		var div="";
		for(var iot in iotHashTable){
			var address=iotHashTable[iot]["address"];
			var deviceid=iotHashTable[iot]["deviceid"];
		    var devicetype=iotHashTable[iot]["devicetype"];
		    div+="<div id='"+deviceid+"' devicetype='"+devicetype+"'>"
					+"<p>"
						+"<img src='images/laugh.png' alt=''/>"
					+"</p>"
					+"<p>"
						+"<span>地址 </span>"
						+"<span>"+address+"</span>"
					+"</p>"
					+"<p>"
						+"<span>编号 </span>"
						+"<span>"+deviceid+"</span>"
					+"</p>"
					+"<p>"
						+"<span>型号 </span>"
						+"<span>"+devicetype+"</span>"
					+"</p>";				
		    if(devicetype=="gasjy4"){   	
					div+="<p>"	
						+"<span>二氧化碳</span>"
						+"<span>0(ppm)</span>"
					+"</p>"
					+"<p>"
						
						+"<span>甲醛</span>"
						+"<span>0(ppb)</span>"
					+"</p>"
					+"<p>"
						+"<span>挥发有机物</span>"
						+"<span>0(ppb)</span>"
					+"</p>"
				+"</div>"
		    }else if(devicetype=="gasjy5"){
		    	div+="<p>"	
						+"<span>臭氧</span>"
						+"<span>0(ppm)</span>"
					+"</p>"
					+"<p>"	
						+"<span>pm25</span>"
						+"<span>0(微克/m3)</span>"
					+"</p>"
					+"<p>"	
						+"<span>pm10</span>"
						+"<span>0(微克/m3)</span>"
					+"</p>"
				+"</div>"
		    }else{
		    	div+="</div>";
		    }
		}
		$("#index").html(div);
		showIotInfoEvent();
	}
	
	function showIotInfoEvent(){
		$("#index>div").click(function(){
			var deviceid=$(this).attr("id");
			var devicetype=$(this).attr("devicetype");
			switch(devicetype){
				case "gasjy4":
					window.open("https://"+serverHttpIp+":20000/charttest2/scancode.html?id="+encodeURI(deviceid));
					break;
				case "gasjy5":
					window.open("https://"+serverHttpIp+":20000/charttest2/gasjy5.html?id="+encodeURI(deviceid));
					break;
				default:
					break;
			}
		})
	}
	
	
	
	
	function getscopelevel(){
		if(scopelevel=="detachment"){
			return {
				"detachment":levelvalue
			}
		}else if(scopelevel=="borough"){
			return {
				"borough":levelvalue
			}
		}else if(scopelevel=="brigade"){
			return {
				"brigade":levelvalue
			}
		}else{
			return {
				"master":""
			}
		}
	}
	
	function stationWebsocket(){
		var rollCall_websocket = new WebSocket(iotwsServer);
		rollCall_websocket.onopen = function (evt) {
			console.warn("物联网连接成功");
			var messageObj = {
				"msgcode":100,
				"msgname":"session",
				"message":userLoginSessionId
			}
			var msg = JSON.stringify(messageObj);
			rollCall_websocket.send(msg);
		};
				
		rollCall_websocket.onclose = function (evt) {
			stationWebsocket();
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
			var id=message[i]["deviceid"];
			
			if(id in iotHashTable){
				var devicetype=iotHashTable[id]["devicetype"];		
				var address=iotHashTable[id]["address"];
				if(devicetype=="gasjy4"){
					var state=judgegasjy4State(message[i]);
				}else if(devicetype=="gasjy5"){
					var state=judgegasjy5State(message[i])
				}

				var border="border";
				var alarmColor="2px solid #D81E06";
				var normalColor="1px solid #fff";
				
				if(state=="alarm"){
					var content="气体浓度超标";
					$("#"+id+">p:nth-child(1)>img").attr("src","images/cry.png");
					$("#"+id).css("border",alarmColor);
					//需要把记录的放到消息里面去
					tipsAlarmInfo(content,address,id,2);
				}else{
					$("#"+id+">p:nth-child(1)>img").attr("src","images/laugh.png");
					$("#"+id).css("border",normalColor);					
				}
			}	
		}
	}
	
	function judgegasjy4State(gasjy4Info){
		var deviceid=gasjy4Info["deviceid"];
		var pm25=gasjy4Info["pm25"];
		var pm10=gasjy4Info["pm10"];
		var co2=gasjy4Info["co2"];
		var ch2o=gasjy4Info["ch2o"];
		var tvoc=gasjy4Info["tvoc"];
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

		$("#"+deviceid+">p:nth-child(5)>span:nth-child(2)").html(co2+"(ppm)");
		$("#"+deviceid+">p:nth-child(6)>span:nth-child(2)").html(ch2o+"(ppb)");
		$("#"+deviceid+">p:nth-child(7)>span:nth-child(2)").html(tvoc+"(ppb)");
		
		if(airFlag>5){
			return "alarm";
		}else{
			return "normal";
		}
		
	}
	
	function judgegasjy5State(gasjy5Info){
		var deviceid=gasjy5Info["deviceid"];
		var pm25=gasjy5Info["pm25"];
		var pm10=gasjy5Info["pm10"];
		var oxygen3=gasjy5Info["oxygen3"];
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
		
		if(oxygen3>500){
			airFlag+=5;
		}else{
			airFlag+=1;
		}
		
		$("#"+deviceid+">p:nth-child(5)>span:nth-child(2)").html(pm25+"(微克/m3)");
		$("#"+deviceid+">p:nth-child(6)>span:nth-child(2)").html(pm10+"(微克/m3)");
		$("#"+deviceid+">p:nth-child(7)>span:nth-child(2)").html(oxygen3+"(ppm)");
		
		if(airFlag>5){
			return "alarm";
		}else{
			return "normal";
		}
	}
	
	
	function tipsAlarmInfo(content,title,address,icon){
		var str=content+"<br/>"+address;
		layuier.alert(str,{title:title,icon:icon,time:10000});
	}
	
	var layuier;
	showSelectLayui();
	function showSelectLayui(){
		layui.use(['form','laydate','layer'], function(){
			layuier = layui.layer;
		});
	}
	
	
	/****************************************测试代码*****************************************************/
	setInterval(function(){	
		var obj={
			"station":"三林园5号楼",
			"address":"5号楼301",
			"deviceid":"10000001",
			"devicetype":"gasjy4",
			"timestamp":"1589160117787",
			"event":"heartbeat",
			"status":"",
			"alarmtype":null,
			"power":100,
			"temperature":10,
			"humidity":-1,
			"tvoc":20,
			"ch2o":10,
			"co":0,
			"co2":10000,
			"oxygen":10,
			"ammonia":10,
			"hepatic":20,
			"chlorine":30,
			"ex":20,
			"pm25":300,
			"pm10":0,
			"signal":20
		}
		//updategasjyDeviceStatus([obj]);
	},6000);
	
	setInterval(function(){
		var obj={
			"station":"三林园5号楼",
			"address":"5号楼301",
			"deviceid":"10000001",
			"devicetype":"gasjy4",
			"timestamp":"1589160117787",
			"event":"heartbeat",
			"status":"",
			"alarmtype":null,
			"power":100,
			"temperature":10,
			"humidity":-1,
			"tvoc":20,
			"ch2o":99,
			"co":0,
			"co2":1,
			"oxygen":10,
			"ammonia":10,
			"hepatic":20,
			"chlorine":100,
			"ex":20,
			"pm25":100,
			"pm10":0,
			"signal":20
		}
		//updategasjyDeviceStatus([obj]);
	},10000);
	/****************************************测试代码*****************************************************/
	
	
}