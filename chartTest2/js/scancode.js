window.onload=function(){
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
	var sessionId="";
	var devicetype="";
    var chartIndex=0;
	var loginObj={
		"name":"weiwei",
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
					devicetype=data["data"]["devicetype"];
					var owner=data["data"]["owner"];
					var houseowner=data["data"]["houseowner"];
					var activetime=data["data"]["activetime"];
					var producer=data["data"]["producer"];
					$(".gasjyTop>p:nth-child(2)>span:nth-child(2)").html(deviceid);
					$(".gasjyTop>p:nth-child(3)>span:nth-child(2)").html(address);
					$(".gasjyTop>p:nth-child(4)>span:nth-child(2)").html(devicetype);
					$(".gasjyTop>p:nth-child(5)>span:nth-child(2)").html(producer);
					$(".gasjyTop>p:nth-child(6)>span:nth-child(2)").html(houseowner);
				}
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
		}
	}
	
	$(".gasjyBottom>button").click(function(){
		switch(devicetype){
			case "gasjy4":
				window.open("gasjy4.html?id="+encodeURI(deviceid));
				break;
			case "gasms400":
				window.open("gasms400.html?id="+encodeURI(deviceid));
				break;
			case "tempjy5":
				window.open("tempjy5.html?id="+encodeURI(deviceid));
				break;
			default:
				break;
		}
	})

}