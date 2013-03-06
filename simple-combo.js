/**
* jQuery Simple Combo
* https://github.com/dudiq/simple-combo
*
* @version: 0.1 - 2011.06.10
* @author: dudiq
* @licence: MIT http://www.opensource.org/licenses/mit-license.php
**/
(function(window, console) {

function jqSimpleCombo(div, data, opt) {
    var combo = {
        _data: null,
        _env: null,
        _div: null, //render container
        _btn: null,
        _id: null,
        _enableDiv: null,
        _list: null,
        _input: null,
        _opt: null, // options
        _init: function(div, data, opt) {
            if ($(div[0]) == undefined){
                this._error("Error :: There are undefined HTML Container for draw combo");
                return;
            }
            var self = this;
            this._div = $("<div class='simple-combo'><input class='simple-combo-input' type='text'><span class='simple-combo-btn'/><div class='simple-combo-container-list' ><div class='simple-combo-list'/></div></div>");
            this._opt = (typeof opt == "object") ? opt : {};
            this._env = {};
            this._enableDiv = $("<div class='simple-combo-disable'/>");
            this._div.append(this._enableDiv);
            this._initContent();
            this.setData(data);
            div.append(this._div);
            this.enable(this.enable());
            this.readonly(this.readonly());
        },
        _initContent: function(){
            var btn = this._btn = this._div.children(".simple-combo-btn"),
                div = this._div,
                list = this._list = this._div.find(".simple-combo-list"),
                listContainer = this._items = this._div.find(".simple-combo-container-list").attr("unselectable", "on"),
                input = this._input = this._div.children(".simple-combo-input"),
                self = this;
            function setListContainerPos(){
                listContainer.width((self.listWidth() != undefined) ? self.listWidth() : self._div.width());
                list.css("max-height",(self.listHeight() != undefined) ? self.listHeight() : "");
                listContainer.css({top: "", bottom: "", left: self._div.offset().left});
                var top = input.offset().top + input.height() - $(document).scrollTop() + listContainer.height();
                if (top > $(window).height()){
                    listContainer.css("top", btn.parent().offset().top - listContainer.height());
                } else {
                    listContainer.css("top", btn.height() + btn.parent().offset().top);
                }
            }
            $(document.body).append(listContainer);
            this._env["windowResize"] = function(){
                if (listContainer != undefined){
                    if (listContainer.is(":visible")){
                        setListContainerPos();
                    }
                }
            };
            $(window).bind("resize.simple-combo", this._env["windowResize"]);

            btn.click(function(){
                if (listContainer.is(":hidden")){
                    if (!self.enable() || !self.canOpenSelect()) return;
                    setListContainerPos();
                    self._selectItem(self._env["selIndex"]);
                    listContainer.show();
                    input.focus();
                    $(self).trigger(jqSimpleCombo.onDropDown);
                } else {
                    self._onFocusOut();
                }
            });
            var callPropIEHack = true;
            list.mousedown(function(ev){
                var el = self._getEventElem(ev);
                if (el != undefined && self.enable()){
                    if (el.hasClass("simple-combo-list")){
                        ev.preventDefault();
                        ev.stopPropagation();
                        callPropIEHack = false;
                        input.focus();
                    } else {
                        el = el.closest(".combo-item");
                        var index = el.data("index");
                        if (index != undefined){
                            self.selectItem(index);
                            listContainer.hide();
                        }
                    }
                }

                window.setTimeout(function(){
                    //hack for IE focusout event problem
                    callPropIEHack = true;
                }, 10);

            });
            var keySelectIndex = 0;
            input.keypress(function(ev){
                if (!self.enable()) return;
                if (listContainer.is(":hidden")){
                    btn.click();
                    keySelectIndex = -1;
                }
                $(self).trigger(jqSimpleCombo.onKeyPress, [ev]);
                var checkKeyPress = function(){
                    keySelectIndex = (self.getData().length < keySelectIndex + 1) ? 0 : keySelectIndex;
                    keySelectIndex = (keySelectIndex < 0) ? self.getData().length - 1 : keySelectIndex;
                };
                switch (ev.keyCode){
                    case 37:
                    case 38:
                        keySelectIndex--;
                        checkKeyPress();
                        self._selectItem(keySelectIndex);
                    break;
                    case 39:
                    case 40:
                        keySelectIndex++;
                        checkKeyPress();
                        self._selectItem(keySelectIndex);
                    break;
                    case 13:
                        self.selectItem(keySelectIndex);
                        listContainer.hide();
                    break;
                }
                self._log("keypress" + keySelectIndex);
            });
            input.click(function(){
                if (self.readonly()){
                    btn.click();
                }
            });
            input.focus(function(ev){
                if (!div.hasClass("simple-combo-focus")){
                    div.addClass("simple-combo-focus");
                    if (callPropIEHack && self.enable()){
                        $(self).trigger(jqSimpleCombo.onFocusIn);
                    }
                }
            });
            var focusOutTrigger = true;
            btn.mousedown(function(){
                focusOutTrigger = false;
            });
            btn.mouseup(function(){
                focusOutTrigger = true;
            });
            input.focusout(function(ev){
                if (!self.enable()) return;
                var el = $(this);
                if (callPropIEHack){
                    if (focusOutTrigger){
                        self._onFocusOut();
                    }
                } else {
                    el.focus();
                }
                callPropIEHack = true;
            });
        },
        _onFocusOut: function(){
            this._div.removeClass("simple-combo-focus");
            this._items.hide();
            $(this).trigger(jqSimpleCombo.onFocusOut);
        },
        _getEventElem: function(ev){
            return $((ev.originalEvent.target || ev.originalEvent.srcElement));
        },
        clearSelection: function(){
            this.setText("");
            this._env["selIndex"] = undefined;
        },
        selectItem: function(index, callEvent){
            var data = this.getData();
            if (data[index] != undefined){
                this._selectItem(index);
                this._input.val(data[index][0]);
                this._env["selIndex"] = index;
                if (callEvent !== false){
                    $(this).trigger(jqSimpleCombo.onSelect, [data[index], index]);
                }
            }
        },
        _selectItem: function(index){
            if (index == undefined){
                return;
            }
            var list = this._list;
            list.children(".combo-item-sel").removeClass("combo-item-sel");
            var item = list.children().eq(index).addClass("combo-item-sel");
            if (list.is(":visible") && item[0] != undefined){
                list.scrollTop(0);
                var dx = list.height()/2 - item.height()/2;
                var offSetDx = item.offset().top - list.offset().top;
                list.scrollTop(offSetDx - dx);
            }
        },
        _log: function(msg){
            return; // for deploy
            if (console)
                console.log(msg);
        },
        _error: function(msg){
            if (console)
                console.error(msg);
        },
        option: function(key, val){
            return (val == undefined) ? this._opt[key] : this._opt[key] = val;
        },
        readonly: function(val){
            if (val != undefined){
                this._opt["readonly"] = val;
                if (val === true){
                    this._input.prop("readOnly", true);
                } else {
                    this._input.prop("readOnly", false);
                }
            }
            return (this._opt["readonly"] !== false);
        },
        enable: function(val){
            if (val != undefined){
                this._opt["enable"] = val;
                if (val === false){
                    this._enableDiv.show();
                    this._items.hide();
                } else {
                    this._enableDiv.hide();
                }
            }
            return (this._opt["enable"] !== false);
        },
        listWidth: function(val){
            if (val != undefined){
                this._opt["listWidth"] = val;
            }
            return this._opt["listWidth"];
        },
        listHeight: function(val){
            if (val != undefined){
                this._opt["listHeight"] = (isNaN(parseFloat(val))) ? undefined : parseFloat(val);
            }
            return this._opt["listHeight"];
        },
        base: function(){
            return this._div;
        },
        setData: function(val){
            if ($.isArray(val)){
                this._list.empty();
                var tmp = $("<div/>");
                for (var i = 0, l = val.length; i < l; i++){
                    var label = val[i][0];
                    var value = val[i][1];
                    var span = $("<span class='combo-item'>" + val[i][0] + "</span>").data("index", i);
                    (val[i][2] != undefined && val[i][2] == true) ? span.addClass("combo-item-sel"): null;
                    tmp.append(span);
                }
                this._list.append(tmp.children());
                this._data = val;
            }
        },
        getData: function(){
            return this._data;
        },
        getSelectedIndex: function(){
            return this._env["selIndex"];
        },
        getSelectedValue: function(){
            return (this._env["selIndex"] != undefined) ? this._data[this._env["selIndex"]][1] : undefined;
        },
        getSelectedText: function(){
            return (this._env["selIndex"] != undefined) ? this._data[this._env["selIndex"]][0] : undefined;
        },
        setValue: function(val){
            var text = val;
            for (var i =0, l = this._data.length; i < l; i++){
                if (this._data[i][1] == val){
                    text = this._data[i][0];
                    this.selectItem(i, false);
                    break;
                }
            }
            this.setText(text);
        },
        setText: function(val){
            this._input.val(val);
        },
        getText: function(){
            return this._input.val();
        },
        updateItem: function(index, newData){
            this._data[index] = newData;
            var item = this._list.children().eq(index).html(newData[0]);
        },
        addItem: function(newData){
            if (jQuery.isArray(newData)){
                this._data.push([newData[0], newData[1]]);
            }
        },
        clear: function(){
            this._data.length = 0; this._data = undefined; this._data = [];
            this._list.empty();
        },
        canOpenSelect: function(val){
            if (val != undefined){
                this._env["canOpenSelect"] = val;
                this._items.hide();
            }
            return (this._env["canOpenSelect"] !== false);
        },
        closeList: function(){
            this._items.hide();
        },
        destroy: function(){
            if (this._env && this._env["windowResize"]){
                $(window).unbind("resize.simple-combo", this._env["windowResize"]);
            }
            this._btn = undefined;
            this._items.remove();
            this._input = undefined;
            this._list = undefined;
            this._opt = undefined;
            this._data = undefined;
            if (this._div){
                this._div.empty().remove();
            }
            this._env = undefined;
            $(this).unbind();
        },
        itemsListContainer: function(){
            return this._list;
        },
        inputContainer: function(){
            return this._input;
        },
        width: function(val){
            return this._div.width(val);
        },
        height: function(val){
            if (val != undefined){
                var cssVal = (isNaN(parseFloat(val))) ? val : val + "px";

                this._input.height(val).css("right", cssVal);
                if (jQuery.browser.msie){
                    this._input.css("line-height", cssVal);
                }
                this._btn.width(val).height(val);
            }
            return this._div.height(val);
        }
    };
    combo._init(div, data, opt);
    return combo;
}

jqSimpleCombo.onSelect = "Event#jqSimpleCombo#onSelect";
jqSimpleCombo.onFocusIn = "Event#jqSimpleCombo#onFocusIn";
jqSimpleCombo.onFocusOut = "Event#jqSimpleCombo#onFocusOut";
jqSimpleCombo.onDropDown = "Event#jqSimpleCombo#onDropDown";
jqSimpleCombo.onKeyPress = "Event#jqSimpleCombo#onKeyPress";

window['jqSimpleCombo'] = jqSimpleCombo;

})(window, window['console']);