window.onload=function(){	
	var userLoginSessionId = sessionStorage.getItem("sessionId"); //session
	var userLoginAddr = sessionStorage.getItem("addr"); //地理位置
	var userLoginType = sessionStorage.getItem("usertype"); //获取权限
	var userLoginName=sessionStorage.getItem("username");//用户登录名称
	var levelvalue=sessionStorage.getItem("levelvalue");//用户登录所属值
	var scopelevel=sessionStorage.getItem("scopelevel");//用户登录所属组织
	var userLoginLongitude=sessionStorage.getItem("addr_longitude");//用户登录经度
	var userLoginLatitude=sessionStorage.getItem("addr_latitude");//用户登录纬度
	var userLoginCity=sessionStorage.getItem("city");//用户登录城市
	var userLoginPhone=sessionStorage.getItem("phone");//用户登录电话,用于对讲

	var callBackFlag=1;//用来判断调用的是那个接口
	var brigadeHash={};//保存所有的支队
	var boroughHash={};//保存所有的大队
	var detachmentHash={};//保存所有的中队
	var stationMarkerHashTable = {};//创建对象,保存设备的marker;
	var stationHashTable={};//保存所有设备的基本信息
	var stationUserHash={};//保存微型站的所有登录用户信息
	var stationBrigadeArr=[];//保存设备里面的支队
	var stationBoroughArr=[];//保存设备里面的大队
	var stationDetachmentArr=[];//保存设备里面的中队
	var iotDeviceHash={};//保存物联网的所有数据
	var currentStation="";//保存页面当前显示的站点
	
	var rootTreeData=[];//构建左侧菜单节点数
	var objRoot={};//树的根节点
	var treeData=[];//建立树结构的数组
	
	//查询所有的支队
	sendHttpSynRequest(stationUser_url+"user/getbrigade","");
	function getBrigadeCallBack(data){
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
				//构建节点数
				buildTree(rootTreeData);
				var  flag=0;
				for(var i  in stationHashTable){
					showSensorPage(i);
					flag++;
					if(flag>0){
						return;
					}
				}
				
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
				rootTreeData.push(stationData[i]);
			}
		}else{
			httpResError();
		}
	}
	
	function buildTree(data)
	{
		for(var i=0;i<data.length;i++){				
			setStationMenu(data[i]);//构建节点数数据
		}
		setParameterTree();//开始建立节点数
		
	}
	
	function setStationMenu(station){
		var detachment =station["detachment"];
		var brigade = station["brigade"];
		var borough = station["borough"];
		var name = station["name"];
		for(var iRoot=0;iRoot<treeData.length;iRoot++){		
			var oneNodeName=treeData[iRoot]["text"];
			if(oneNodeName == brigade){		
				var brigadeChildren=treeData[iRoot]["children"];
				for(var boroughNode=0;boroughNode<brigadeChildren.length;boroughNode++){		
					var twoNodeName=brigadeChildren[boroughNode]["text"];
					if(twoNodeName==borough){
						var boroughChildren=brigadeChildren[boroughNode]["children"];
						for(var detachmentNode=0;detachmentNode<boroughChildren.length;detachmentNode++){
							var threeNodeName=boroughChildren[detachmentNode]["text"]
							if(threeNodeName==detachment){
								boroughChildren[detachmentNode]["children"].push(
									//插入第4级
									{
										"id":4,
										"text":name,
										"iconCls":"icon_company"
										
									}
								)
								return;
							}
						}
						/*找不到中队
						创建3级中队
						创建4级节点*/
						brigadeChildren[boroughNode]["children"].push(
							{
								"id":3,
								"text":detachment,
								"iconCls":"icon_detachment",
								"children":[
									{
										"id":4,
										"text":name,
										"iconCls":"icon_company"
									
									}
									
								]
							}
						)
						return;
					}
				}
				/*找不到大队		
				创建大队
				创建中队
				创建4级节点	*/
				treeData[iRoot]["children"].push({
					"id":2,
					"text":borough,
					"iconCls":"icon_borough",
					"children":[
						{
							"id":3,
							"text":detachment,
							"iconCls":"icon_company",
							"children":[
								{
									"id":4,
									"text":name,
									"iconCls":"icon_company"
									
								}
							]
						}
					]
				})
				return;
			}
		}
		/*创建 支队 节点
		创建大队
		创建中队
		创建4级节点	*/
		var stationObj={
			"id":1,
			"text":brigade,
			"iconCls":"icon_brigade",
			"children":[
				{
					"id":2,
					"text":borough,
					"iconCls":"icon_borough",
					"children":[
						{
							"id":3,
							"text":detachment,
							"iconCls":"icon_detachment",
							"children":[
								{
									"id":4,
									"text":name,
									"iconCls":"icon_company"	
								}	
							]
						}
					]	
				}
			]
		}
		treeData.push(stationObj);
		return;	 		
	}	

	function setParameterTree(){
		$('.easyui-tree').tree({
	    	data:treeData,
	      	formatter:function(node){
	          	var s = "";
	          	var id=node["id"];
	          	var text=node["text"];	
	          	if(id==4){
	          		s+="<span title='"+node.text+"' class='nodeCompany'>"+node.text+"</span>"
	          	}else{
	          		s+="<span title='"+node.text+"' class='nodeChildren'>"+node.text+"</span>"
	          	}
	         	
	            return s;
       	 	},
        	animate:true,
        	lines:true
	    })
		setTimeout(function(){
			addMenuEvent();//给节点数添加事件
		},300);
		
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

	function addMenuEvent(){
		$(".tree-node").click(function(){
			var name=$(this).children(".tree-title").children("span").html();
			var type=$(this).children(".tree-title").children("span").attr("class");
			if(type=="nodeCompany"){
				showSensorPage(name);
			}
		})
	}
	
	//判断物联网是不是在内存里面，如果不在就发送请求获取物联网
	function iotDeviceRamFlag(content){
 		var flag=0;
		if(JSON.stringify(iotDeviceHash)!="{}"){
			if(content in iotDeviceHash){
				flag=1;
				return;
			}
		}
		if((flag==0)||(JSON.stringify(iotDeviceHash)=="{}")){
			callBackFlag=6;	
			var url=java_url+"getownersensor";
			iotDeviceHash[content]=[];//设置物联网设备为{"station":[]}
			var data={
				"owner":content
			}
			sendHttpSynRequest(url,data);
		}
 	}
	
	
	function showSensorPage(name){
		iotDeviceRamFlag(name);	
		var div="";
		if(name in iotDeviceHash){
			currentStation=name;
			var iotDeviceArr=iotDeviceHash[name];
			for(var i=0;i<iotDeviceArr.length;i++){
				var address=iotDeviceArr[i]["address"];
				var deviceid=iotDeviceArr[i]["deviceid"];	
				var co2=iotDeviceArr[i]["co2"];	
				var pm25=iotDeviceArr[i]["pm25"];	
				var pm10=iotDeviceArr[i]["pm10"];	
				var ch2o=iotDeviceArr[i]["ch2o"];	
				var tvoc=iotDeviceArr[i]["tvoc"];	
				var temperature=iotDeviceArr[i]["temperature"];	
				var humidity=iotDeviceArr[i]["humidity"];	
				div+="<div id='"+deviceid+"'><p>"
					+"<span>地址</span>"
					+"<span>"+address+"</span>"
					+"<span>详情</span></p>"
					+"<div>"
						+"<div>"
							+"<p>"
								+"<span>编号</span>"
								+"<span>"+deviceid+"</span>"
								+"<span>(离线)</span>"
							+"</p>"
							+"<p>"
								+"<span>温度</span>"
								+"<span>"+temperature+"(℃)</span>"
							+"</p>"
							+"<p>"
								+"<span>湿度</span>"
								+"<span>"+humidity+"(%)</span>"
							+"</p>"
							+"<p>"
								+"<span>PM2.5</span>"
								+"<span>"+pm25+"(微克/m³)</span>"
							+"</p>"
							+"<p>"
								+"<span>PM10</span>"
								+"<span>"+pm10+"(微克/m³)</span>"
							+"</p>"
							+"<p>"
								+"<span>二氧化碳</span>"
								+"<span>"+co2+"(ppm)</span>"
							+"</p>"
							+"<p>"
								+"<span>甲醛</span>"
								+"<span>"+ch2o+"(ppb)</span>"
							+"</p>"
							+"<p>"
								+"<span>挥发有机物</span>"
								+"<span>"+tvoc+"(ppb)</span>"
							+"</p>"
						+"</div>"
						+"<div>"
							+"<p></p>"
							+"<p>"
								+"<img src='images/laugh.png' alt=''>"
								+"<span>优</span>"
							+"</p>"
							+"<p></p>"
						+"</div>"
					+"</div>"
				div+="</div>";
			}
		}
		$(".main_right").html(div);						
		showSensorEvent()//添加气体的详情页面。	
		
		//再去循环改变状态
		for(var i=0;i<iotDeviceArr.length;i++){	
			var address=iotDeviceArr[i]["address"];
			var deviceid=iotDeviceArr[i]["deviceid"];	
			var co2=iotDeviceArr[i]["co2"];	
			var pm25=iotDeviceArr[i]["pm25"];	
			var pm10=iotDeviceArr[i]["pm10"];	
			var ch2o=iotDeviceArr[i]["ch2o"];	
			var tvoc=iotDeviceArr[i]["tvoc"];	
			var deviceInfo={
				"pm25":pm25,
				"pm10":pm10,
				"co2":co2,
				"ch2o":ch2o,
				"tvoc":tvoc,
				"station":name,
				"deviceid":deviceid,
				"type":"page",
				"address":address
			}
			updateDeviceStatus(deviceInfo);
		}
		
	}
	
	function showSensorEvent(){
		$(".main_right>div>p>span:nth-child(3)").click(function(){
			var id=$(this).parent().parent().attr("id");
			var address=$(this).prev().html();
			window.open("gasjy4.html?id="+id+"&name="+encodeURI(encodeURI(address))+"&currentStation="+encodeURI(encodeURI(currentStation)));
		})
	}
	
	function getsensorCallBack(data){
		var code=data["code"];
		if(code==0){
			var data=data["data"];
			for(var i=0;i<data.length;i++){	
				var station=data[i]["owner"];
				var devicetype=data[i]["devicetype"];
				if(devicetype=="gasjy4"){
					data[i]["co2"]=0;
					data[i]["pm25"]=0;
					data[i]["pm10"]=0;
					data[i]["ch2o"]=0;
					data[i]["tvoc"]=0;
					data[i]["temperature"]=0;
					data[i]["humidity"]=0;
					iotDeviceHash[station].push(data[i]);
				}
			}
		}
	}
	
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
			case 6://获取传感器的数据
				getsensorCallBack(data);
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
	
	/*做一个定时器,检测页面是否还在*/
	var heartbeat =3;
	setInterval(function() {
		heartbeat--;
		if(heartbeat==0){
			alert("网络连接中断...请重新的登录");
			window.location.href="login.html";
		}
		var obj = {
			"sessionId": userLoginSessionId
		}
		$.ajax({
			url: java_url + "user/active",
			type: "post",
			dataType: "json",
			headers: {
				"Content-Type": "application/json;charset=utf-8",
				"Authorization": userLoginSessionId
			},
			data: JSON.stringify(obj),
			success: function(d) {
				heartbeat++;
			}
		})
	}, 15000);
	
	stationWebsocket();
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
			console.log("iotWebsocket Disconnected");
		};
				
		rollCall_websocket.onmessage = function (evt) {	
			var data=JSON.parse(evt.data);
			var msgcode=data["msgcode"];
			var message=data["message"];
			console.log(data);
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
			var ch2o=message[i]["ch2o"];//甲醛
			var tvoc=message[i]["tvoc"];//可挥发气体
			var pm25=message[i]["pm25"];//pm25
			var pm10=message[i]["pm10"];//pm10
			var co2=message[i]["co2"];//可然气体
			var power=message[i]["power"];
			var temperature=parseFloat(message[i]["temperature"]/10); //温度
			var humidity=parseFloat(message[i]["humidity"]/10);//湿度
			var currentTimestamp=message[i]["timestamp"];//时间戳
			var station=message[i]["station"];//站点
			var deviceid=message[i]["deviceid"];//设备ID
			if(station in iotDeviceHash){
				var iotDeviceArr=iotDeviceHash[station];
				for(var j=0;j<iotDeviceArr.length;j++){
					if(deviceid==iotDeviceArr[j]["deviceid"]){
						iotDeviceArr[j]["co2"]=co2;
						iotDeviceArr[j]["pm25"]=pm25;
						iotDeviceArr[j]["pm10"]=pm10;
						iotDeviceArr[j]["ch2o"]=ch2o;
						iotDeviceArr[j]["tvoc"]=tvoc;
						iotDeviceArr[j]["temperature"]=temperature;
						iotDeviceArr[j]["humidity"]=humidity;
						var address=iotDeviceArr[j]["address"]
					}
				}
			}
			
			$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(1)>span:nth-child(3)").html("(在线)");
			$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(2)>span:nth-child(2)").html(temperature+"(℃)");
			$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(3)>span:nth-child(2)").html(humidity+"(%)");
			$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(4)>span:nth-child(2)").html(pm25+"(微克/m³)");
			$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(5)>span:nth-child(2)").html(pm10+"(微克/m³)");
			$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(6)>span:nth-child(2)").html(co2+"(ppm)");
			$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(7)>span:nth-child(2)").html(ch2o+"(ppb)");
			$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(8)>span:nth-child(2)").html(tvoc+"(ppb)");
			
			var deviceInfo={
				"pm25":pm25,
				"pm10":pm10,
				"co2":co2,
				"ch2o":ch2o,
				"tvoc":tvoc,
				"station":station,
				"deviceid":deviceid,
				"type":"websocket",
				"address":address
			}
			updateDeviceStatus(deviceInfo);
			
		}
	}
	
	function updateDeviceStatus(deviceInfo){
		var ch2o=deviceInfo["ch2o"];//甲醛
		var tvoc=deviceInfo["tvoc"];//可挥发气体
		var pm25=deviceInfo["pm25"];//pm25
		var pm10=deviceInfo["pm10"];//pm10
		var co2=deviceInfo["co2"];//可然气体
		var station=deviceInfo["station"];
		var deviceid=deviceInfo["deviceid"];	
		var type=deviceInfo["type"];
		var address=deviceInfo["address"];
		var airFlag=0;
		var alarmImg="<img  src='images/high.png'>"		
		if(pm25>200){
			var content="PM2.5浓度超标"
			airFlag+=5;
			var p4Length=$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(4)>img").length;
			if(p4Length==0){
				$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(4)").append(alarmImg);
			}	
		}else{
			airFlag+=1;
			$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(4)>img").remove();
		}
		if(pm10>150){
			var content="PM10浓度超标"
			airFlag+=5;
			var p5Length=$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(5)>img").length;
			if(p5Length==0){
				$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(5)").append(alarmImg);
			}
		}else{
			airFlag+=1;
			$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(5)>img").remove();
		}
		
		if(co2>1200){
			var content="C02浓度超标"
			airFlag+=5;
			var p7Length=$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(6)>img").length;
			if(p7Length==0){
				$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(6)").append(alarmImg);
			}
		}else{
			airFlag+=1;
			$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(6)>img").remove();
		}
		
		if(ch2o>120){
			var content="甲醛浓度超标"
			airFlag+=5;
			var p6Length=$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(7)>img").length;
			if(p6Length==0){
				$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(7)").append(alarmImg);
			}	
		}else{
			airFlag+=1;
			$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(7)>img").remove();
		}
		
		if(tvoc>200){
			var content="可挥发气体浓度超标"
			airFlag+=5;
			var p8Length=$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(8)>img").length;
			if(p8Length==0){
				$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(8)").append(alarmImg);
			}	
		}else{
			airFlag+=1;
			$("#"+deviceid+">div>div:nth-child(1)>p:nth-child(8)>img").remove();
		}
		
		if(airFlag>5){
			if(type=="websocket"){
				tipsAlarmInfo(content,station,address,2);
			}
			//改变当前的显示框变为红色
			updateDeviceInfoBackGround(station,deviceid,"alarm");
		}else{
			//恢复正常显示
			updateDeviceInfoBackGround(station,deviceid,"normal");
		}	
	}
	
	function updateDeviceInfoBackGround(station,deviceid,state){
		if(station==currentStation){
			var borderNormal="rgba(255, 233, 223, 0.2)";
			var borderAlarm="red";
			if(state=="alarm"){
				$("#"+deviceid).css("border-color",borderAlarm).css("border-width","3px");
				$("#"+deviceid+">div>div:nth-child(2)>p:nth-child(2)>img").attr("src","images/cry.png");
				$("#"+deviceid+">div>div:nth-child(2)>p:nth-child(2)>span").html("差");
			}else if(state=="normal"){
				$("#"+deviceid).css("border-color",borderNormal).css("border-width","1px");
				$("#"+deviceid+">div>div:nth-child(2)>p:nth-child(2)>img").attr("src","images/laugh.png");
				$("#"+deviceid+">div>div:nth-child(2)>p:nth-child(2)>span").html("优");
			}
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
			"station":"汇智.园满星空间",
			"deviceid":"10000105",
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
			"co2":1,
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