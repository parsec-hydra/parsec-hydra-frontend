#pragma strict

import System.Text.RegularExpressions;
import System.Collections.Generic;
import System.Reflection;

public class uQuery extends Array {
    
	public var context : UnityEngine.Component;
	public var rquickExpr : String = "^(?:#([\\w-]+)|(\\w+)|.([\\w-]+))$";
	private var renderer : Component = null;
	
	public function uQuery(selector : System.Object) {
		this(selector, null);
	}
	
	// As originally init()
	public function uQuery(selector : System.Object, context : System.Object) {
		// Init array itself
		//super();
		if ( !selector ) {
			return;
		}
	
		// Handle jQuery(MonoBehaviour)
		if( selector.GetType().IsSubclassOf(Component) ) {
			this[0] = this.context = selector as UnityEngine.Component;
			return;
		}
		// Handle jQuery(GameObject)
		if( selector.GetType().IsSubclassOf(GameObject) ) {
			this[0] = this.context = (selector as GameObject).transform;
			return;
		}
	
		// check different contexts
		if(context != null) {
	
			// Context == jQuery
			if( context.GetType() == this.GetType() ) {
				this.context = (selector as uQuery).context;
	
			// Context == MonoBehaviour
			} else if( context.GetType().IsSubclassOf(Component) ) {
				this.context = context as Component;
	
			// Context == GameObject
			} else if( context.GetType().IsSubclassOf(Component) ) {
				this.context = (context as GameObject).transform;
			}
		}
	
		// Handle HTML strings
		if ( selector.GetType() == System.String ) {
			// If we had id-kind-of-fast selector, we could do "^(#([\\w-]*)$)" match here.
			// But since we don't we just skip and find whatever we want
	
			// todo: handle if we have context
			//if(context) super(context);
	
			this.Find(selector.ToString());
		}
	}
	
	
	public function Find(selector : String) {
	
		var match : System.Text.RegularExpressions.Match = Regex.Match(selector, rquickExpr);
	
		var i : int = 0;
		var a : Array = new Array();
		if(match.Success) {
	
			// #ID
			if(match.Groups[1].Value) {
				var path : String = this.GetAbsolutePathFrom(context);
				var foundGO : GameObject = GameObject.Find(path + match.Groups[1].Value);
				if(foundGO != null) a.Push(foundGO.transform);
	
			// TAG
			} else if(match.Groups[2].Value) {
				var gameObjectsWithTag : GameObject[] = GameObject.FindGameObjectsWithTag(match.Groups[2].Value);
				if(context != null) {
					for(var children : Transform in context.GetComponentsInChildren.<Transform>()) {
						var children : GameObject = children.gameObject;
						for(var gameObjectWithTag : GameObject in gameObjectsWithTag) {
							if(match == children) a.Push(match);
						}
					}
				} else {
					for(; i<gameObjectsWithTag.length; ) {
						a.Push(gameObjectsWithTag[i++].transform);
					}
				}
	
			// .CLASS
			} else if(match.Groups[3].Value) {
				var type : System.Type = System.Type.GetType(match.Groups[3].Value);
				
				if(type == null) {
					var assembly : System.Reflection.Assembly = System.Reflection.Assembly.Load("UnityEngine");
					type = assembly.GetType("UnityEngine." + match.Groups[3].Value);
				}
				
				if(type != null) {
					if(context != null) a = context.GetComponentsInChildren(type);
					else a = UnityEngine.Object.FindObjectsOfType(type);
				}
	
			}
	
		}
	
		for(i = 0; i < a.length; ) {
			this[i] = a[i++];
		}
	
	}
	
	// Helper for getting unity object's paths
	public function GetAbsolutePathFrom(target : Component) : String {
		if(target == null) return "";
	
		var ret : String = "";
		var curr : Transform = target.transform;
		while(curr.parent != null) {
			ret += curr.name + "/";
		}
		ret = "/" + ret;
	
		return ret;
	}
	
	public function each( /*obj : System.Object,*/ callback : Function ) {
		var isObj : boolean = !this.GetType().IsSubclassOf(Array);
		var i : int = 0;
	
		if( isObj ) {
			// Confusing, in which case we would have an object?
	
		} else {
			for( ; i < this.length; ) {
				//(this[i++] as System.Object).call(callback);
				callback.Call([this[i], this[i++] as Component]);
			}
		}
		return this;
	}
	
	public function isVisble() : boolean {
		
		var ret : boolean = false;
		
		if(context.renderer) {
			ret = context.renderer.enabled;
		}
		if(context.guiTexture) {
			ret = ret || context.guiTexture.enabled;
		}
		
		return ret;
	}
	
	public function children() : uQuery {
		return uQuery(".Transform", context);
	}
	
	public static function ajax(url : String) : uQueryXHR {
	    return uQuery.ajax(url, null);
	}
	
	public static function ajax(settings : Boo.Lang.Hash) : uQueryXHR {
	    return uQuery.ajax(settings["url"] as String, settings);
	}
	
	public static function ajax(url : String, settings : Boo.Lang.Hash) : uQueryXHR {
	    var xhr : uQueryXHR = new uQueryXHR();
	    var form : WWWForm = new WWWForm();
	    xhr.headers = form.headers;
	    xhr.form = form;
	    
	    xhr.url = url;
	    
	    if ( settings['beforeSend'] != null ) {
	        xhr.beforeSend = settings['beforeSend'] as Function;
	    }
	    
	    if( settings['cache'] == false ) {
	        xhr.cache = false;
	    }
	    
	    if ( settings['complete'] != null ) {
	        xhr.complete = settings['complete'] as Function;
	    }
	    
	    if ( settings['contentType'] != null ) {
	        xhr.headers['Content-Type'] = settings['contentType'];
	    }
	    
	    if ( settings['data'] != null ) {
	        if ( settings['data'].GetType() == Boo.Lang.Hash ) {
	            xhr.data = settings['data'] as Boo.Lang.Hash;
	        }
	    }
	    
	    if ( settings['error'] != null ) {
	        xhr.error = settings['error'] as Function;
	    }
	    
	    if ( settings['headers'] != null ) {
	        for( var entry : System.Collections.DictionaryEntry in settings['headers'] as System.Collections.DictionaryEntry[] ) {
	            xhr.headers.Add(entry.Key.ToString(), entry.Value.ToString());
	        }
	    }
	    
	    if ( settings['success'] != null ) {
	        xhr.success = settings['success'] as function(String, uQueryXHR);
	    }
	    
	    if ( settings['type'] != null ) {
	        xhr.type = settings['type'].ToString();
	    }
	    
	    if ( settings['username'] != null && settings['password'] != null ) {
	        xhr.headers.Add("Authorization", "Basic " + System.Convert.ToBase64String(System.Text.Encoding.ASCII.GetBytes(settings['username'] + ":" + settings['password'] )));
	    }
	    
	    xhr.run();
	    return xhr;
	    
	}
	
	/* GET */
	
	// Todo: Find a way to use uQuery.get (on lowercase).
	public static function Get(url : String) {
	    Get(url, {});
	}
	
	public static function Get(url : String, data : Boo.Lang.Hash) {
	    Get(url, data, null);
	}
	
	public static function Get(url : String, success : function(String, uQueryXHR)) {
	    Get(url, null, success);
	}
	
	public static function Get(url : String, data : Boo.Lang.Hash, success : function(String, uQueryXHR)) {
	    Get(url, data, success, null);
	}
	
	public static function Get(url : String, data : Boo.Lang.Hash, success : function(String, uQueryXHR), dataType : String) { 
	    uQuery.ajax({
	        "url": url,
	        "data": data,
	        "success": success,
	        "dataType": dataType
	    });
	}
	
	
	/* POST */
	
	public static function post(url : String) {
	    post(url, {});
	}
	
	public static function post(url : String, data : Boo.Lang.Hash) {
	    post(url, data, null);
	}
	
	public static function post(url : String, data : Boo.Lang.Hash, success : function(String, uQueryXHR)) {
	    post(url, data, success, null);
	}
	
	public static function post(url : String, data : Boo.Lang.Hash, success : function(String, uQueryXHR), dataType : String) { 
	    uQuery.ajax({
	        "type": "POST",
	        "url": url,
	        "data": data,
	        "success": success,
	        "dataType": dataType
	    });
	}
	
	
	/**
	 * We'll use Unity's own animations.
	 *
	 * @NOTE:
	 * Propably will be changed to something like
	 * http://prime31.github.com/GoKit/
	 * because animations don't allow us to
	 * fade from current state but only from
	 * fixed states.
	 * Another approach would be to dynamically
	 * generate animations just before they are
	 * fired.
	 */
	
	public function animate( attr : String, prop : String, from : float, to: float, speed : float , callback : Function ) {
		return this.each(function(_, ctx : Component) {
		
			var a : AnimationClip = new AnimationClip();
			var affects : UnityEngine.Object[];
			switch(attr.ToLower()) {
				case "color":
					a.SetCurve("", GUITexture, "m_Color." + prop, new AnimationCurve.Linear(0,from,speed,to));
					a.SetCurve("", Material, "_Color." + prop, new AnimationCurve.Linear(0,from,speed,to));
					affects = [ctx.guiTexture as UnityEngine.Object, ctx.renderer as UnityEngine.Object];
					break;
				case "scale":
					affects = [];
					//a.SetCurve("", GUITexture, "m_Color." + prop, new AnimationCurve.Linear(0,from,speed,to));
					a.SetCurve("", Transform, "localScale." + prop, new AnimationCurve.Linear(0,from,speed,to));
			}
			var tmpName : String = "anim" + Time.realtimeSinceStartup;
			
			var cb : AnimationEvent = new AnimationEvent();
			cb.messageOptions = SendMessageOptions.DontRequireReceiver;
			cb.functionName = "AnimationEnded";
			cb.time = speed;
			cb.stringParameter = tmpName;
			a.AddEvent(cb);
			
			var start : AnimationEvent = new AnimationEvent();
			start.functionName = "AnimationStarted";
			start.time = 0;
			a.AddEvent(start);
		
			var anim : Animation = ctx.animation;
			if(anim == null) anim = ctx.gameObject.AddComponent.<Animation>();
			anim.AddClip(a, tmpName);
			anim.PlayQueued(tmpName);
			anim.Play();
			
			var cbHolder : AnimationCallback = ctx.gameObject.AddComponent.<AnimationCallback>();
			cbHolder.caller = tmpName;
			cbHolder.holdCallerAlive = this;
			cbHolder.callback = callback;
			cbHolder.affects = affects;
			cbHolder.setAnimationValues = function() {
				switch(attr.ToLower()) {
					case "scale":
						for(var fill : String in ["x", "y", "z"]) {
							if(fill == prop) return;
							var val : float = parseFloat(uQuery(ctx.transform).attr(fill, "localScale").ToString());
							anim.GetClip(tmpName).SetCurve("", Transform, "localScale." + fill, new AnimationCurve.Linear(0,val,speed,val));
							//Debug.Log(fill + " = " + );
						}
						break;
				}
				
			};
		});
	}
	
	// Show and hide functions
	public function hide() {
		return this.each(function(_, ctx : Component) {
			if(ctx == null) return;
			
			uQuery(ctx).children().each(function(_, ctx) {
				if(ctx != null) uQuery(ctx).toggleVisible(false);
			});
			
		});
	}
	
	public function show() {
		return this.each(function(_, ctx : Component) {
			if(ctx == null) return;
			
			uQuery(ctx).children().each(function(_, ctx) {
				if(ctx != null) uQuery(ctx).toggleVisible(true);
			});
		});
	}
	
	public function toggleVisible(visibility : boolean) {
		
		if(context.renderer) {
			context.renderer.enabled = visibility;
		}
		if(context.guiTexture) {
			context.guiTexture.enabled = visibility;
		}
		
	}
	
	public function toggleVisible() {
		this.toggleVisible(!this.isVisble());
	}
	
	public function fadeIn() {
		return this.animate( "color", "a", 0.0, 1.0, 3.0, function(_) { this.show(); }); 
	}
	
	public function fadeOut() {
		return this.animate( "color", "a", 1.0, 0.0, 3.0, function(_) { this.hide(); });
	}
	
	public function slideOut() {
		return this.animate( "scale", "y", 1.0, 0.0, 3.0, function(_) { this.show(); });
	}
	
	public function slideIn() {
		return this.animate( "scale", "y", 0.0, 1.0, 3.0, function(_) { this.show(); });
	}
	
	// Basic bahviour of callbacks
	// 
	// @TODO: Pass data with callback
	//
	public function bind(property : String, callback : Function) {
		return this.on(property, callback);
	}
	
	public function on(property : String, callback : Function) {
		return this.each(function(_, ctx : Component) {
			var event : uQueryEvent = ctx.gameObject.GetComponent.<uQueryEvent>();
			if(event == null) event = ctx.gameObject.AddComponent.<uQueryEvent>();
			event.add(property, callback);
		});
	}
	
	public function trigger(property : String) {
		return this.each(function(_, ctx : Component) {
			var event : uQueryEvent = ctx.gameObject.GetComponent.<uQueryEvent>();
			if(event == null) return;
			event.trigger(property);
		});
	}
	
	// Shorthands for callbacks
	//
	public function click(callback : Function) {
		return this.bind("click", callback);
	}
	
	public function mousedown(callback : Function) {
		return this.bind("mousedown", callback);
	}
	
	public function mouseup(callback : Function) {
		return this.bind("mouseup", callback);
	}
	
	public function mouseenter(callback : Function) {
		return this.bind("mouseenter", callback);
	}
	
	public function mouseleave(callback : Function) {
		return this.bind("mouseleave", callback);
	}
	
	public function mouseout(callback : Function) {
		return this.bind("mouseleave", callback);
	}
	
	public function mouseover(callback : Function) {
		return this.bind("mouseover", callback);
	}
	
	public function attr(property : String, value : Object) {
		var e : PropertyInfo = context.GetType().GetProperty(property);
		if(e != null) {
			e.SetValue(context, value, null);
		}
	}
	
	public function attr(property : String) {
		var e : PropertyInfo = context.GetType().GetProperty(property);
		if(e != null) {
			return e.GetValue(context, null);
		}
		return null;
	}
	
	public function attr(property : String, holder : String) {
		var e1 : PropertyInfo = context.GetType().GetProperty(holder);
		if(e1 != null) {
			var holderObj : Object = e1.GetValue(context, null);
			var e2 : FieldInfo = holderObj.GetType().GetField(property);
			if(e2 != null) {
				return e2.GetValue(holderObj);
			}
		}
		return null;
	}
	
	public function addClass(className : String) {
		return this.each(function(_, ctx : Component) {
			if(ctx == null) return;
			ctx.gameObject.AddComponent(className);
		});
	}
	
	public function removeClass(className : String) {
		return this.each(function(_, ctx : Component) {
			if(ctx == null) return;
			UnityEngine.Object.Destroy(ctx.gameObject.GetComponent(className));
		});
	}
	
	public function toggleClass(className : String) {
		return this.each(function(_, ctx : Component) {
			if(ctx == null) return;
			var c : Component = ctx.gameObject.GetComponent(className);
			if(c == null) ctx.gameObject.AddComponent(className);
			else UnityEngine.Object.Destroy(c);
		});
	}
	
	public function hasClass(className : String) : boolean {
		var ctx : Component = context;
		if(ctx == null && this.length > 0) {
			ctx = this[0] as Component;
		}
		if(ctx == null) return false;
		return ctx.gameObject.GetComponent(className) != null;
	}

}

public class AnimationCallback extends MonoBehaviour {
	
	public var setAnimationValues : Function;
	public var callback : Function;
	public var caller : Object;
	public var holdCallerAlive : uQuery;
	public var affects : UnityEngine.Object[];
	
	public function Awake() {
		this.hideFlags = HideFlags.HideAndDontSave;
	}
	
	public function AnimationStarted() : void {
		for(var a : UnityEngine.Object in affects) {
			if(a != null) {
				uQuery(a).attr("enabled", true);
			}
		}
		if(setAnimationValues != null) setAnimationValues();
	}
	
	public function AnimationEnded(called : String) : void {
		if(called != caller) return;
		if(callback != null) callback(holdCallerAlive);
		animation.RemoveClip(called);
		if(animation.GetClipCount() == 0) Destroy(animation);
		Destroy(this);
	}
}

public class uQueryEvent extends MonoBehaviour {
	
	private var handlers : Dictionary.<String, Array> = new Dictionary.<String, Array>();
	
	public function Awake() {
		this.hideFlags = HideFlags.HideAndDontSave;
	}
	
	public function add(types : String, handler : Function) {
		for(var type : String in types.Split(" "[0])) {
			var currHandler : Array;
			try {
				currHandler = handlers[type];
			} catch(e) {
				handlers[type] = currHandler = new Array();
				currHandler.Push(handler);
			}
		}
	}
	
	public function remove(types : String, handler : Function) {
		for(var type : String in types.Split(" "[0])) {
			var currHandler : Array = handlers[type];
			if(currHandler == null) continue;
			
			// if no handler provided, clear all
			if(handler != null) {
				handlers['type'] = new Array();
			} else {
				for( var i : int = 0; i < currHandler.length; i++ ) {
					if(currHandler[i] != null && currHandler[i] == handler) currHandler.Splice(i, 1);
				}
			}
		}		
	}
	
	public function trigger(eventType : String) {
		var currHandlers : Array;
		try {
			currHandlers = handlers[eventType];
		} catch(e) {
			return;
		}
		
		for(var f : Function in currHandlers.ToBuiltin(Function) as Function[]) {
			if(f != null) f(this);
		}
	}
	
	public function Update() {
		trigger("update");
	}
	
	public function LateUpdate() {
		trigger("lateupdate");
	}
	
	public function FixedUpdate() {
		trigger("fixedupdate");
	}
	
	public function OnMouseEnter() {
		trigger("mouseenter");
	}
	
	public function OnMouseOver() {
		trigger("mouseover");
	}
	
	public function OnMouseExit() {
		trigger("mouseleave");
	}
	
	public function OnMouseDown() {
		trigger("mousedown");
	}
	
	public function OnMouseUp() {
		trigger("mouseup");
	}
	
	public function OnMouseUpAsButton() {
		trigger("click");
	}
	
	// TODO: Collision triggers
	// TODO: keyboard click triggers
}

public class uQueryXHR extends System.Object {
	
	// TODO: Cleanup other callbacks than success function
	
	public var success : function(String, uQueryXHR);
	public var complete : Function;
	public var error : Function;
	public var beforeSend : Function;
	public var form : WWWForm;
	public var cache : boolean = true;
	public var data : Boo.Lang.Hash;
	public var headers : System.Collections.Hashtable;
	public var type : String = "GET";
	public var www : WWW;
	public var url : String;
	public var _always : Function;
	public var _then : Function;
	
	public function done(callback : function(String, uQueryXHR)) {
		this.success = callback;
		return this;
	}
	public function fail(callback : Function) {
		this.error = callback;
		return this;
	}
	public function always(callback : Function) {
		this._always = callback;
		return this;
	}
	public function then(callback : Function) {
		this._then = callback;
		return this;
	}
	public function run() {
		// Inject
		(MonoBehaviour.FindObjectOfType(MonoBehaviour) as MonoBehaviour).StartCoroutine(_run());
	}
	
	private function _run() {
		if (this.type == "GET") {
			if (!url.Contains("?")) {
				this.url += "?";
			}
			
			for( var entry : System.Collections.DictionaryEntry in this.data ) {
				this.url += "&" + entry.Key.ToString() + "=" + entry.Value.ToString();
			}
			
			if (beforeSend != null) beforeSend(this);
			this.www = new WWW(url);
		} else if ( this.type == "POST" ) {
			
			for( var entry : System.Collections.DictionaryEntry in this.data ) {
				this.form.AddField(entry.Key.ToString(), entry.Value.ToString());
			}
			
			if (beforeSend != null) beforeSend(this);
			this.www = new WWW(this.url, this.form.data, this.headers);
		}
		
		yield www;
		
		if(!String.IsNullOrEmpty(this.www.error)) {
			if (this.error != null) this.error(this);
		} else {
			if (this.success != null) this.success(this.www.text, this);
			if (this.complete != null) this.complete(this);
		}
		
		
		if (this._then != null) this._then(this);
		if (this._always != null) this._always(this);
		
	}
}