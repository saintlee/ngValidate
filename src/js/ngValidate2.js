/**
 * Created by SaintLee on 2017/11/22.
 */
(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define('ngValidate', ['angular'], factory);
    } else if (typeof module === "object" && typeof module.exports === "object") {
        // Node/CommonJS
        if (typeof angular === 'undefined') {
            factory(require('angular'));
        } else {
            factory(angular);
        }
    } else {
        // Browser globals (global is window)
        factory(global.angular);
    }
}(typeof window !== 'undefined' ? window : this, function (angular) {
    'use strict';

    if (typeof angular === 'undefined') {
        throw new Error('ngValidate.js requires angular')
    }

    var vModule = angular.module('ngValidate', ['ng']);

    function Validate($scope, element, ngModelCtrl, setting, $parentScope) {
        this.$scope = $scope;
        this.$element = element;
        this.element = element[0];
        this.ngModelCtrl = ngModelCtrl;
        this.setting = setting; // 设置
        this.$parentScope = $parentScope;

        this.$verify = []; //待验证
    }

    Validate.prototype = {
        register: function (verify) {
            if (angular.isArray(verify)) {
                angular.forEach(verify, function (value) {
                    this.push(value);
                }, this.$verify)
            } else {
                this.$verify.push(verify);
            }
        },
        unRegister: function (verify) {
            if (angular.isArray(verify)) {
                angular.forEach(verify, function (value) {
                    var index = this.indexOf(value);
                    this.splice(index, 1);
                }, this.$verify)
            } else {
                var index = this.$verify.indexOf(verify);
                this.$verify.splice(index, 1);
            }

        }
    };

    vModule.service('ngValidate', ['toolkit', function (toolkit) {

        function ValidateExtend() {
            this.key = {};
            this.msg = {};
            this.method = {};
        }

        ValidateExtend.prototype = {
            setParam: function (param) {
                if (param.key === undefined || param.method === undefined) {
                    toolkit.loggerError("addValidate param is error!");
                    return;
                }
                this.key[param.key] = angular.isUndefined(param.default) ? '' : param.default;
                this.msg[param.key] = param.msg;
                this.method[param.key] = param.method;
            },
            register: function (param) {
                if (angular.isArray(param)) {
                    for (var i in param) {
                        this.setParam(param[i]);
                    }
                } else {
                    this.setParam(param);
                }
            }
        };

        var extendValidate = new ValidateExtend();
        return {
            // 扩展验证方式
            addValidate: function (param) {
                extendValidate.register(param);
            },
            getValidate: function () {
                return extendValidate;
            }
        }
    }]);

    // 工具集
    vModule.provider('toolkit', function () {
        this.$get = ['$parse', function ($parse) {
            var toolkit = {
                /**
                 * 格式化配置参数
                 * @param option
                 * @param iElement
                 * @returns {Object}
                 */
                formatOption: function (option, iElement) {
                    if (option.charAt(0) !== "{") {
                        option = '{' + option + '}';
                    }

                    try {
                        return eval("(" + option + ")");
                    } catch (e) {
                        this.loggerError('ngValidate options [ ' + option + ' ] has error:', iElement);
                    }
                },
                isEmptyObject: function (obj) { // 是否为空对象
                    if (typeof obj !== 'object') {
                        return false;
                    }
                    var key;
                    for (key in obj) {
                        return false;
                    }
                    return true;
                },
                getDocument: function (elem) {
                    var element = undefined;
                    if (typeof elem === 'object') { //已经是dom
                        element = elem;
                    }
                    if (typeof elem === 'string') {
                        if (elem.indexOf('#') === 0) {
                            //id方式获取
                            elem = elem.slice(1, elem.length);
                            element = window.document.getElementById(elem);
                        } else {
                            //name方式获取
                            angular.forEach(window.document.getElementsByName(elem), function (dom) {
                                if (angular.element(dom).attr('ng-validate') !== undefined) {
                                    element = dom;
                                    return false;
                                }
                            })
                        }
                    }
                    return element;
                },
                getScopeValue: function ($scope, value) {
                    var split = value.split(".");
                    var $scopeValue = $scope;
                    for (var i = 0; i < split.length; i++) {
                        if ($scopeValue !== undefined) {
                            $scopeValue = $scopeValue[split[i]];
                        }
                    }
                    return $scopeValue;
                },
                formatMsg: function (msg, value) { // 格式化消息
                    if (/{\d+}/.test(msg)) {
                        if (!angular.isArray(value)) {
                            value = [value];
                        }
                        for (var i = 0; i < value.length; i++) {
                            msg = msg.replace(new RegExp("\\{" + i + "\\}", "g"), value[i]);
                        }
                    }
                    return msg;
                },
                getArray: function (arrValue) {
                    if (angular.isArray(arrValue) || angular.isUndefined(arrValue)) {
                        return arrValue;
                    }
                    if (arrValue.charAt(0) !== "[") {
                        arrValue = '[' + arrValue + ']';
                    }
                    try {
                        return eval(arrValue);
                    } catch (e) {
                        this.loggerError('ngValidate getArray [ ' + arrValue + ' ] has error:');
                    }
                },
                getDateReg: function (dateFormat) {
                    var dateFormatTmp = dateFormat.replace('yyyy', '(?!0000)[0-9]{4}')
                        .replace('MM', '(?:0[1-9]|1[0-2])')
                        .replace('dd', '(?:0[1-9]|1[0-9]|2[0-9]|3[0-1])')
                        .replace('HH', '(?:[0-2][0-3])')
                        .replace('mm', '[0-5][0-9]')
                        .replace('ss', '[0-5][0-9]')
                        .replace('SSS', '(\d{3})');
                    var dateFormatReg = "^" + dateFormatTmp + '$';
                    return new RegExp(dateFormatReg);
                },
                getExtensionReg: function (extension) {
                    extension = toolkit.getArray(extension);
                    var extensionReg = '';
                    angular.forEach(extension, function (value, key) {
                        if (key === 0) {
                            extensionReg += '(';
                        }
                        extensionReg += value + '|';
                        if (key + 1 === extension.length) {
                            extensionReg = extensionReg.substr(0, extensionReg.length - 1);
                            extensionReg += ')$';
                        }
                    });
                    return new RegExp(extensionReg);
                },
                execFunction: function (fn, args) {
                    try {
                        if (typeof fn === 'string') {
                            fn = eval(fn);
                        }
                        return fn.apply(this, args);
                    } catch (e) {
                        toolkit.loggerError("exec function error", e);
                    }
                },
                loggerError: function (msg, iElement) {
                    console.group("[ngValidate Error]");
                    console.error(msg);
                    if (iElement !== undefined) {
                        console.error(iElement);
                    }
                    console.groupEnd();
                }
            };
            return toolkit;
        }];
    });

    // 参数
    vModule.provider('parameter', function () {
        var defaults = this.defaults = {
            extend: {
                required: true, // 必须验证
                pattern: new RegExp(), // 正则验证
                email: true, // 邮箱验证
                url: true, // url验证
                date: '', // 日期验证
                format: 'yyyy-MM-dd HH:mm:ss', // 日期格式验证
                phone: true, // 手机号验证
                number: true,// 有效数字验证
                digits: true, // 数字验证
                extension: [], // 后缀验证
                least: 0, // checkbox 勾选个数验证
                most: 0, // checkbox 勾选个数验证
                min: 0, // 最小数值验证
                max: 0, // 最大数值验证
                range: [], // 数值区间验证
                minlength: 0, // 最小长度验证
                maxlength: 0, // 最大长度验证
                rangelength: [], // 长度区域验证
                method: '', // 自定义函数验证
                equal: '',// 是否相等验证
                remote: '' // 远程连接验证
            },
            message: {
                required: '此项为必填字段',
                pattern: '该字段不符合要求',
                email: '请输入有效的电子邮件地址',
                url: '请输入有效的网址',
                date: '请输入有效的日期',
                format: '日期格式不符合{0}',
                phone: '请输入有效的手机号',
                number: '请输入有效的数字',
                digits: '只能输入数字',
                extension: '请输入有效的后缀',
                least: '至少选择 {0} 项',
                most: '最多选择 {0} 项',
                min: '请输入不小于 {0} 的数字',
                max: '请输入不大于 {0} 的数字',
                range: '请输入范围在 {0} 到 {1} 之间的数字',
                minlength: '最少要输入 {0} 个字符',
                maxlength: '最多可以输入 {0} 个字符',
                rangelength: '请输入长度在 {0} 到 {1} 之间的字符串',
                method: '该字段不符合要求',
                equal: '你的输入不相同',
                remote: '请检查此字段'
            },
            setting: {
                isClose: false, // 关闭验证
                tipModel: 'tip', // 模式： tip: 悬浮提示；tail: 尾部追加.
                tipClass: 'ng-validate-tip', // tip class名称以及前缀
                tipPosition: 'bottom' // tip位置
            },
            defaultMessage: '该字段不符合要求'
        };

        this.$get = ['toolkit', 'ngValidate', function (toolkit, ngValidate) {
            var parameter = {
                // 组合验证
                assembleVerify: function ($attrs, messageOpt) {
                    // 扩展验证
                    var extend = angular.extend({}, defaults.extend, ngValidate.getValidate().key);
                    var $verify = [];
                    angular.forEach(extend, function (val, key) {
                        var attrValue = $attrs[key];
                        if (extend.hasOwnProperty(key) && attrValue !== undefined) {
                            var value = parameter.tolerantValue(attrValue, val, key);
                            var msg = parameter.tolerantMsg(key, value, messageOpt);
                            this.push({key: key, value: value, msg: msg});
                        }
                    }, $verify);
                    return $verify;
                },
                verifyKeys: function () {
                    return defaults.extend;
                },
                tolerantKey: function (key) {
                    return key;
                },
                // 验证值容错
                tolerantValue: function (attrValue, defaultValue, key) {
                    var val = attrValue === "" ? defaultValue : attrValue;
                    if (key === 'email' || key === 'url' || key === 'phone' || key === 'number' || key === 'digits') {
                        val = Boolean(val);
                    } else if (key === 'least' || key === 'most' || key === 'min' || key === 'max') {
                        val = Number(val);
                    } else if (key === 'format') {
                        val = toolkit.getDateReg(val);
                    } else if (key === 'extension') {
                        val = toolkit.getExtensionReg(val);
                    } else if (key === 'range' || key === 'rangelength') {
                        val = toolkit.getArray(val);
                    }
                    return val;
                },
                // 消息容错
                tolerantMsg: function (key, value, msgOpt) {
                    var msg = msgOpt[key] || defaults.message[key] || ngValidate.getValidate().msg[key] || defaults.defaultMessage;
                    return toolkit.formatMsg(msg, value);
                }
            };
            return parameter;
        }];
    });

    // 坐标计算
    vModule.factory('$dimensions', ['$document', '$window', function ($document, $window) {

        var $dimensions = {};

        /**
         * 确定元素 节点名
         * @param element
         * @param nodeName
         */
        var nodeName = $dimensions.nodeName = function (element, name) {
            return element.nodeName && element.nodeName.toLowerCase() === name.toLowerCase();
        };

        /**
         * 根据属性名, 返回元素 计算的属性值
         * @param element
         * @param property
         * @param extra
         */
        $dimensions.css = function (element, property, extra) {
            var value;
            if (element.currentStyle) { //IE
                value = element.currentStyle[property];
            } else if (window.getComputedStyle) {
                value = window.getComputedStyle(element)[property];
            } else {
                value = element.style[property];
            }
            return extra === true ? parseFloat(value) || 0 : value;
        };

        /**
         * 返回元素 偏移量 offset
         * @param element
         * @returns {{width: (Number|number), height: (Number|number), top: number, left: number}}
         */
        $dimensions.offset = function (element) {
            var boxRect = element.getBoundingClientRect();
            var docElement = element.ownerDocument;
            return {
                width: boxRect.width || element.offsetWidth,
                height: boxRect.height || element.offsetHeight,
                top: boxRect.top + (window.pageYOffset || docElement.documentElement.scrollTop) - (docElement.documentElement.clientTop || 0),
                left: boxRect.left + (window.pageXOffset || docElement.documentElement.scrollLeft) - (docElement.documentElement.clientLeft || 0)
            };
        };

        /**
         * 返回元素 位置 position
         * @param element
         * @returns {{width: number, height: number, top: number, left: number}}
         */
        $dimensions.position = function (element) {

            var offsetParentRect = {top: 0, left: 0},
                offsetParentElement,
                offset;

            if ($dimensions.css(element, 'position') === 'fixed') {
                offset = element.getBoundingClientRect();
            } else {
                offsetParentElement = offsetParent(element);

                offset = $dimensions.offset(element);
                if (!nodeName(offsetParentElement, 'html')) {
                    offsetParentRect = $dimensions.offset(offsetParentElement);
                }

                offsetParentRect.top += $dimensions.css(offsetParentElement, 'borderTopWidth', true);
                offsetParentRect.left += $dimensions.css(offsetParentElement, 'borderLeftWidth', true);
            }

            return {
                width: element.offsetWidth,
                height: element.offsetHeight,
                top: offset.top - offsetParentRect.top - $dimensions.css(element, 'marginTop', true),
                left: offset.left - offsetParentRect.left - $dimensions.css(element, 'marginLeft', true)
            };

        };

        /**
         * 获取最靠近并且非静态定位的父级元素
         * @required-by fn.position
         * @param element
         */
        var offsetParent = function offsetParentElement(element) {
            var docElement = element.ownerDocument;
            var offsetParent = element.offsetParent || docElement;
            if (nodeName(offsetParent, '#document')) return docElement.documentElement;
            while (offsetParent && !nodeName(offsetParent, 'html') && $dimensions.css(offsetParent, 'position') === 'static') {
                offsetParent = offsetParent.offsetParent;
            }
            return offsetParent || docElement.documentElement;
        };

        /**
         * 类似于jQuery获取height的函数
         * @required-by bootstrap-affix
         * @url http://api.jquery.com/height/
         * @param element
         * @param outer
         */
        $dimensions.height = function (element, outer) {
            var value = element.offsetHeight;
            if (outer) {
                value += $dimensions.css(element, 'marginTop', true) + $dimensions.css(element, 'marginBottom', true);
            } else {
                value -= $dimensions.css(element, 'paddingTop', true) + $dimensions.css(element, 'paddingBottom', true) + $dimensions.css(element, 'borderTopWidth', true) + $dimensions.css(element, 'borderBottomWidth', true);
            }
            return value;
        };

        /**
         * 类似于jQuery获取width的函数
         * @required-by bootstrap-affix
         * @url http://api.jquery.com/width/
         * @param element
         * @param outer
         */
        $dimensions.width = function (element, outer) {
            var value = element.offsetWidth;
            if (outer) {
                value += $dimensions.css(element, 'marginLeft', true) + $dimensions.css(element, 'marginRight', true);
            } else {
                value -= $dimensions.css(element, 'paddingLeft', true) + $dimensions.css(element, 'paddingRight', true) + $dimensions.css(element, 'borderLeftWidth', true) + $dimensions.css(element, 'borderRightWidth', true);
            }
            return value;
        };


        /**
         * 计算 元素 显示的 位置
         * @param placement
         * @param position
         * @param actualWidth
         * @param actualHeight
         * @returns {*}
         */
        $dimensions.getCalculatedOffset = function getCalculatedOffset(placement, position, actualWidth, actualHeight) {
            var offset;
            var split = placement.split('-');

            switch (split[0]) {
                case 'right':
                    offset = {
                        top: position.top + position.height / 2 - actualHeight / 2,
                        left: position.left + position.width
                    };
                    break;
                case 'bottom':
                    offset = {
                        top: position.top + position.height,
                        left: position.left + position.width / 2 - actualWidth / 2
                    };
                    break;
                case 'left':
                    offset = {
                        top: position.top + position.height / 2 - actualHeight / 2,
                        left: position.left - actualWidth
                    };
                    break;
                default:
                    offset = {
                        top: position.top - actualHeight,
                        left: position.left + position.width / 2 - actualWidth / 2
                    };
                    break;
            }

            if (!split[1]) {
                return offset;
            }

            if (split[0] === 'top' || split[0] === 'bottom') {
                switch (split[1]) {
                    case 'left':
                        offset.left = position.left;
                        break;
                    case 'right':
                        offset.left = position.left + position.width - actualWidth;
                }
            } else if (split[0] === 'left' || split[0] === 'right') {
                switch (split[1]) {
                    case 'top':
                        offset.top = position.top - actualHeight;
                        break;
                    case 'bottom':
                        offset.top = position.top + position.height;
                }
            }

            return offset;
        };

        $dimensions.getPosition = function getPosition(element, appendToBody) {
            if (appendToBody) {
                return $dimensions.offset(element);
            } else {
                return $dimensions.position(element);
            }
        };

        return $dimensions;
    }]);

    // 提示信息
    vModule.provider('$tooltip', function () {
        var defaults = this.defaults = {
            tipModel: 'tip', // 模式： tip: 悬浮提示；tail: 尾部追加.
            tipClass: 'ng-validate-tip', // tip class名称以及前缀
            tipPosition: 'bottom',// tip位置
            tipTemplate: [
                '<div class="{{tipClass}} {{tipModel}}-in {{tipModel}}-{{tipPosition}}" ng-show="show && title">',
                '<div class="{{tipClass}} {{tipModel}}-arrow"></div>',
                '<span class="{{tipClass}} {{tipModel}}-inner" ng-bind="title"></span>',
                '</div>'
            ].join('')
        };

        this.$get = ['$rootScope', '$compile', '$timeout', '$dimensions', function ($rootScope, $compile, $timeout, $dimensions) {

            //noinspection UnnecessaryLocalVariableJS
            var $tooltipFactory = function (validate) {
                var $tooltip = {},
                    $element = validate.$element,
                    options = $tooltip.$options = angular.extend({}, defaults, validate.setting),
                    scope = $tooltip.$scope = validate.$scope && validate.$scope.$new() || $rootScope.$new(),
                    tooltipElement = angular.element(options.tipTemplate),
                    tooltipLinker = $compile(tooltipElement);

                angular.forEach(defaults, function (value, key) {
                    if (key !== 'tipTemplate') {
                        scope[key] = options[key];
                    }
                });

                $tooltip.destroy = function () {
                    tooltipElement.remove();
                    scope.$destroy();
                };

                $tooltip.setScope = function (option) {
                    if (!option) {
                        return;
                    }
                    angular.forEach(['title', 'show'], function (key) {
                        if (angular.isDefined(option[key])) {
                            scope[key] = option[key];
                        }
                    });
                };

                $tooltip.position = function () {
                    var elementPosition = $dimensions.getPosition($element[0], false),
                        tooltipWidth = $element.prop('offsetWidth'),
                        tooltipHeight = $element.prop('offsetHeight'),
                        tooltipPosition = $dimensions.getCalculatedOffset(options.tipPosition, elementPosition, tooltipWidth, tooltipHeight);

                    tooltipPosition.top += 'px';
                    tooltipPosition.left += 'px';

                    tooltipElement.css(tooltipPosition);
                };

                $tooltip.init = function () {
                    tooltipLinker(scope);

                    tooltipElement.css({top: '-9999px', left: '-9999px'});
                    tooltipElement.addClass(options.placement);
                    $element.after(tooltipElement);

                    $timeout(this.position);
                };

                $tooltip.show = function (option) {
                    this.setScope(angular.extend({show: true}, option));
                    $element.removeClass('ng-validate-success').addClass('ng-validate-error');
                };

                $tooltip.hide = function () {
                    this.setScope({show: false});
                    $element.removeClass('ng-validate-error').addClass('ng-validate-success');
                };

                $tooltip.init();

                return $tooltip;
            };

            return $tooltipFactory;
        }];
    });

    // 验证工厂
    vModule.factory('validatorFactory', ['toolkit', '$http','ngValidate', function (toolkit, $http,ngValidate) {

        var extendMethods = this.extendMethods = {
            // 必须验证
            required: function (ngModelCtrl, verifyValue, verifyKey) {
                var value = ngModelCtrl.$viewValue;
                var validity = !ngModelCtrl.$isEmpty(value);
                ngModelCtrl.$setValidity(verifyKey, validity);
            },
            // 邮箱验证
            email: function (ngModelCtrl, verifyValue, verifyKey) {
                var value = ngModelCtrl.$viewValue;
                var validity = ngModelCtrl.$isEmpty(value) || /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value);
                ngModelCtrl.$setValidity(verifyKey, validity);
            },
            // url验证
            url: function (ngModelCtrl, verifyValue, verifyKey) {
                var value = ngModelCtrl.$viewValue;
                var validity = ngModelCtrl.$isEmpty(value) || /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
                ngModelCtrl.$setValidity(verifyKey, validity);
            },
            // 日期验证
            date: function (ngModelCtrl, verifyValue, verifyKey) {
                var value = ngModelCtrl.$viewValue;
                var validity = ngModelCtrl.$isEmpty(value) || !/Invalid|NaN/.test(new Date(value).toString());
                ngModelCtrl.$setValidity(verifyKey, validity);
            },
            // 日期格式验证
            format: function (ngModelCtrl, verifyValue, verifyKey) {
                var value = ngModelCtrl.$viewValue;
                var validity = ngModelCtrl.$isEmpty(value) || verifyValue.test(value);
                ngModelCtrl.$setValidity(verifyKey, validity);
            },
            // 手机号验证
            phone: function (ngModelCtrl, verifyValue, verifyKey) {
                var value = ngModelCtrl.$viewValue;
                var validity = ngModelCtrl.$isEmpty(value) || /^1[34578]\d{9}$/.test(value);
                ngModelCtrl.$setValidity(verifyKey, validity);
            },
            // 有效数字验证
            number: function (ngModelCtrl, verifyValue, verifyKey) {
                var value = ngModelCtrl.$viewValue;
                var validity = ngModelCtrl.$isEmpty(value) || /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value);
                ngModelCtrl.$setValidity(verifyKey, validity);
            },
            // 数字验证
            digits: function (ngModelCtrl, verifyValue, verifyKey) {
                var value = ngModelCtrl.$viewValue;
                var validity = ngModelCtrl.$isEmpty(value) || /^\d+$/.test(value);
                ngModelCtrl.$setValidity(verifyKey, validity);
            },
            // 后缀验证
            extension: function (ngModelCtrl, verifyValue, verifyKey) {
                var value = ngModelCtrl.$viewValue;
                var validity = ngModelCtrl.$isEmpty(value) || verifyValue.test(value);
                ngModelCtrl.$setValidity(verifyKey, validity);
            },
            // checkbox 勾选最少个数验证
            least: function (ngModelCtrl, verifyValue, verifyKey) {
                var value = ngModelCtrl.$viewValue,
                    arrValue = toolkit.getArray(value) || [];
                var validity = ngModelCtrl.$isEmpty(value) || arrValue.length >= verifyValue;
                ngModelCtrl.$setValidity(verifyKey, validity);
            },
            // checkbox 勾选最多个数验证
            most: function (ngModelCtrl, verifyValue, verifyKey) {
                var value = ngModelCtrl.$viewValue,
                    arrValue = toolkit.getArray(value) || [];
                var validity = ngModelCtrl.$isEmpty(value) || arrValue.length <= verifyValue;
                ngModelCtrl.$setValidity(verifyKey, validity);
            },
            // 最小数值验证
            min: function (ngModelCtrl, verifyValue, verifyKey) {
                var value = ngModelCtrl.$viewValue;
                var validity = ngModelCtrl.$isEmpty(value) || value >= verifyValue;
                ngModelCtrl.$setValidity(verifyKey, validity);
            },
            // 最大数值验证
            max: function (ngModelCtrl, verifyValue, verifyKey) {
                var value = ngModelCtrl.$viewValue;
                var validity = ngModelCtrl.$isEmpty(value) || value <= verifyValue;
                ngModelCtrl.$setValidity(verifyKey, validity);
            },
            // 数值区间验证
            range: function (ngModelCtrl, verifyValue, verifyKey) {
                var value = ngModelCtrl.$viewValue;
                var validity = ngModelCtrl.$isEmpty(value) || (value >= verifyValue[0] && value <= verifyValue[1]);
                ngModelCtrl.$setValidity(verifyKey, validity);
            },
            // 长度区域验证
            rangelength: function (ngModelCtrl, verifyValue, verifyKey) {
                var value = ngModelCtrl.$viewValue;
                var validity = ngModelCtrl.$isEmpty(value) || ( value.length >= verifyValue[0] && value.length <= verifyValue[1] );
                ngModelCtrl.$setValidity(verifyKey, validity);
            },
            // 自定义函数验证
            method: function (validate, verifyValue, verifyKey) {
                var ngModelCtrl = validate.ngModelCtrl,
                    $scope = validate.$scope,
                    value = ngModelCtrl.$viewValue;
                var validity = ngModelCtrl.$isEmpty(value) || $scope[verifyKey]();
                ngModelCtrl.$setValidity(verifyKey, validity);
            },
            // 是否相等验证
            equal: function (validate, verifyValue, verifyKey) {
                var ngModelCtrl = validate.ngModelCtrl,
                    $parentScope = validate.$parentScope,
                    value = ngModelCtrl.$viewValue;
                var document = toolkit.getDocument(verifyValue);
                var verifyVal = undefined;
                if (document !== undefined) {
                    var $element = angular.element(document);
                    verifyVal = $element.val();
                } else {
                    verifyVal = toolkit.getScopeValue($parentScope, verifyValue);
                }
                var validity = ngModelCtrl.$isEmpty(value) || angular.equals(value, verifyVal);
                ngModelCtrl.$setValidity(verifyKey, validity);
            },
            // 远程连接验证
            remote: function (validate, verifyValue, verifyKey, validator) {
                var ngModelCtrl = validate.ngModelCtrl,
                    value = ngModelCtrl.$viewValue;
                if (ngModelCtrl.$isEmpty(value)) {
                    ngModelCtrl.$setValidity(verifyKey, true);
                    validator.validate(validate);
                } else {
                    $http.get(verifyValue).then(function (data) {
                        // TODO 远程连接验证
                        ngModelCtrl.$setValidity(verifyKey, true);
                        validator.validate(validate);
                    }, function (err) {
                        ngModelCtrl.$setValidity(verifyKey, false);
                        validator.validate(validate);
                    });
                }
            }
        };

        var validatorFactory = {
            extension: function (validate, validator) {
                var ngModelCtrl = validate.ngModelCtrl,
                    $verify = validate.$verify;
                var validaterMethods = angular.extend({},extendMethods,ngValidate.getValidate().method);
                angular.forEach($verify, function (verify) {
                    var verifyKey = verify.key;
                    var extendMethod = validaterMethods[verifyKey];
                    if (extendMethod !== undefined) {
                        if (validatorFactory.isSpecialMethods(verifyKey)) {
                            toolkit.execFunction(extendMethod, [validate, verify.value, verifyKey, validator]);
                        } else {
                            toolkit.execFunction(extendMethod, [ngModelCtrl, verify.value, verifyKey]);
                        }
                    }
                })
            },
            isSpecialMethods: function (verifyKey) {
                return verifyKey === 'remote' || verifyKey === 'method' || verifyKey === 'equal';
            },
            getExtendMethods: function () {
                return extendMethods;
            }
        };

        return validatorFactory;
    }]);

    // 验证
    vModule.provider('validator', function () {

        this.$get = ['toolkit', '$tooltip', 'validatorFactory', function (toolkit, $tooltip, validatorFactory) {
            var validator = {
                // 初始化
                build: function (validate) {
                    validatorFactory.extension(validate, validator);
                    validator.validate(validate);
                },
                // 验证字段
                validate: function (validate) {
                    var ngModelCtrl = validate.ngModelCtrl;
                    if (ngModelCtrl.$dirty && ngModelCtrl.$invalid) { // 验证不通过
                        var errorTypes = Object.keys(ngModelCtrl.$error),
                            errorKey = errorTypes[0]; // 获取错误类型
                        validator.showTooltip(validate, errorKey);
                    } else { // 验证通过
                        validator.hideTooltip(validate);
                    }
                },
                // 显示信息
                showTooltip: function (validate, errorKey) {
                    var $element = validate.$element,
                        title = validator.getMsg(validate, errorKey),
                        tooltip = $element.data('tooltip');

                    if (tooltip) {
                        tooltip.show({title: title});
                    } else {
                        tooltip = $tooltip(validate);
                        tooltip.show({title: title});
                        $element.data('tooltip', tooltip);
                    }
                },
                // 隐藏信息
                hideTooltip: function (validate) {
                    var tooltip = validate.$element.data('tooltip');
                    if (tooltip) {
                        tooltip.hide();
                    }
                },
                // 获取消息
                getMsg: function (validate, errorKey) {
                    var $verify = validate.$verify,
                        msg = "";
                    for (var i in $verify) {
                        var verify = $verify[i];
                        if (verify !== undefined && verify.key === errorKey) {
                            msg = verify.msg;
                            break;
                        }
                    }
                    return msg;
                }
            };
            return validator;
        }];
    });

    // 父指令. 填写在form表单上
    vModule.directive('ngValidateScope', function () {
        return {
            restrict: 'A',
            require: 'form',
            scope: false, //{}:全新隔离的作用域，true:继承父作用域并创建自己的作用域，false:继承父作用域
            priority: 3,
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                $element[0]._ngValidateScope = $scope;
                this.$parentScope = $scope;
            }],
            link: function postLink(scope, iElement, iAttrs, controller) {
                iElement.attr('novalidate', 'novalidate');// 禁用HTML5自带验证
                iElement.attr('autocomplete', 'off');// 禁用autocomplete
            }
        }
    });

    // 子指令-设置信息. 填写在表单字段元素上或表单字段父级元素上
    vModule.directive('ngValidateSetting', ['toolkit', function (toolkit) {
        return {
            restrict: 'A',
            require: '?^ngValidateScope',
            scope: false,
            priority: 3,
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                this.option = toolkit.formatOption($attrs.ngValidateSetting, $element);
            }]
        }
    }]);

    // 子指令-提示信息. 填写在表单字段元素上或表单字段父级元素上
    vModule.directive('ngValidateMessage', ['toolkit', function (toolkit) {
        return {
            restrict: 'A',
            require: '?^ngValidateScope',
            scope: false,
            priority: 2,
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                this.option = toolkit.formatOption($attrs.ngValidateMessage, $element);
            }]
        }
    }]);

    // 子指令-字段验证. 填写在表单字段元素上
    vModule.directive('ngValidate', ['$timeout', 'parameter', 'validator', function ($timeout, parameter, validator) {
        return {
            restrict: 'A',
            require: ['ngModel', '?^ngValidateScope', '?^ngValidateSetting', '?^ngValidateMessage'],
            scope: {
                "required": "@",
                "ngPattern": "@",
                "ngMinlength": "@",
                "ngMaxlength": "@",

                "email": "@",
                "url": "@",
                "date": "@",
                "format": "@",
                "phone": "@",
                "number": "@",
                "digits": "@",
                "least": "@",
                "most": "@",
                "min": "@",
                "max": "@",
                "range": "@",
                "rangelength": "@",
                "extension": "@",
                "method": "&",
                "equal": "@",
                "remote": "@"
            },
            priority: 1,
            compile: function compile($element, $attrs) {
                return function postLink($scope, $element, $attrs, ctrls) {

                    // 控制器
                    var ngModelCtrl = ctrls[0],
                        scopeCtrl = ctrls[1] || {}, // 父指令控制器
                        settingCtrl = ctrls[2] || {}, // 设置控制器
                        messageCtrl = ctrls[3] || {}; // 消息控制器


                    // 设置和消息参数
                    var $parentScope = scopeCtrl.$parentScope,
                        settingOpt = settingCtrl.option || {},
                        messageOpt = messageCtrl.option || {};

                    // 参数组合
                    var validate = new Validate($scope, $element, ngModelCtrl, settingOpt, $parentScope);

                    // 编译完成执行
                    $timeout(function () {
                        var $verify = parameter.assembleVerify($attrs, messageOpt);
                        validate.register($verify);
                    });

                    // 包装验证字段方法
                    var validatorWarp = function (value) {
                        // 延迟加载
                        $timeout(function () {
                            validator.build(validate);
                        });
                        return value;
                    };

                    // Model -> DOM验证
                    ngModelCtrl.$formatters.push(validatorWarp);

                    // DOM -> Model验证
                    ngModelCtrl.$parsers.push(validatorWarp);
                }
            }
        }
    }]);

    return vModule;
}));