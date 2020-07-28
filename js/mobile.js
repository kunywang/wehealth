window.onload=function(){	
	
	function setCookie(cname,cvalue,exdays){
	    var d = new Date();
	    d.setTime(d.getTime()+(exdays*24*60*60*1000));
	    var expires = "expires="+d.toGMTString();
	    document.cookie = cname+"="+cvalue+"; "+expires;
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
	
	var username=getCookie("username");
	var password=getCookie("password");
	if(username==""||password==""){
		$(".savePwd").children().remove();
		$(".savePwd").css("background", "#fff").css("border","1px solid #ccc");
	}else{
		$(".login_user").val(username);
		$(".login_password").val(password);	
		//直接登录
		login();
	}
	
	function delCookie(name)
	{
		var exp = new Date();
		exp.setTime(exp.getTime() - 1);
		var cval=getCookie(name);
		if(cval!=null)
		document.cookie= name + "="+cval+";expires="+exp.toGMTString();
	}	
	
	
	function login(){
		var username=$(".login_user").val();
		var password=$(".login_password").val();
		var savveL=$(".savePwd").children().length;
		
		if(savveL>0){
			setCookie("username",username,7);
			setCookie("password",password,7);
		}else{
			delCookie("username");
			delCookie("password");
		}

		var obj={
			"name":username,
			"password":hex_md5(password)
		};
		
		loginRequest(obj);
	}	
	
	function loginRequest(obj){
		$.ajax({
			url:stationUser_url+"user/login",
			type:"post",
			dataType:"json",
			contentType:"application/json;charset=utf-8",
			data:JSON.stringify(obj),
			success:function(d){
				var code=d["code"];
				if(code==0){
					var sessionId=d["data"]["session"];
					var usertype=d["data"]["usertype"];
					var levelvalue=d["data"]["levelvalue"];
					var scopelevel=d["data"]["scopelevel"];
					var addr_longitude=d["data"]["organize"]["longitude"];
					var addr_latitude=d["data"]["organize"]["latitude"];
					var city=d["data"]["organize"]["city"];
					var region=d["data"]["organize"]["address"];
					var phone=d["data"]["phone"];					
					if(addr_longitude==0){
						addr_longitude="121.473658";
					}
					if(addr_latitude==0){
						addr_latitude="31.230378";
					}
					sessionStorage.setItem("phone",phone);
					sessionStorage.setItem("addr_longitude",addr_longitude);
					sessionStorage.setItem("addr_latitude",addr_latitude);	
					sessionStorage.setItem("sessionId",sessionId);
					sessionStorage.setItem("levelvalue",levelvalue);
					sessionStorage.setItem("scopelevel",scopelevel);
					sessionStorage.setItem("city",city);
					sessionStorage.setItem("region",region);
					sessionStorage.setItem("usertype",usertype);
					sessionStorage.setItem("username",obj["name"]);
					sessionStorage.setItem("password",hex_md5(password));
					window.location.href="mobileInfo.html";
			}else{
					alert("登录错误");
				}
			}
		})
	}
	
	
	function savePwd(childL,that){
		if(childL!=0) {
			$(that).children().remove();
			$(that).css("background", "#fff").css("border","1px solid #ccc");
		}else{
			$(that).append("<img src='images/rememberPassword.png'>");
			$(that).css("background","#0A953C").css("border",0);
		}
	}
	
	$(".savePwd").click(function(){
		var childL=$(this).children().length;
		savePwd(childL,this);
	})
	
	$(".rememberPwd").click(function(){
		var childL=$(this).prev().children().length;
		var that=$(this).prev();
		savePwd(childL,that);
	})
	
	$(".confLogin").click(function(){
		login();
	})
	
	//忘记密码
	$(".forgetPwd").click(function(){
		alert("请联系管理员");
	})
	
	$(".visitorsPwd").click(function(){
		alert("开发中...");
	})
}