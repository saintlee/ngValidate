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

    var validModule = angular.module('ngValidate', []);

    validModule.service('ngValidate', function () {
        var extendMethod = {};
        return {
            scope: function (formName) {
                var forms = document.getElementsByName(formName);
                var obj; //获取一个对象，它是form上的scope作用域
                for (var i = 0; i < forms.length; i++) {
                    if (forms[i]._ngValidateScope) {
                        obj = forms[i]._ngValidateScope;
                        break;
                    }
                }
                return obj;
            },
            // 扩展验证方式
            addValidate: function (name, message, method) {
                // TODO 扩展验证方式
                console.log(name)
            },
            getValidate: function (name) {

            },
            // method验证扩展
            addMethod: function (name, callback) {
                extendMethod[name] = callback;
            },
            getMethod: function (name) {
                return extendMethod[name];
            }
        }
    });

    // 工具集
    validModule.provider('toolkit', function () {
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
                toLowerCase: function (str) {
                    if (str !== undefined && typeof str === 'string') {
                        str = str.toLowerCase();
                    }
                    return str;
                },
                isValid: function (obj) { // 有效性验证
                    return obj !== undefined && obj !== '' && obj !== false && obj !== 0 && obj !== [];
                },
                typeOf: function (obj1, obj2) { // 类型验证
                    var toString = Object.prototype.toString;
                    return toString.call(obj1) === toString.call(obj2) || toString.call(obj1) === '[object RegExp]';
                },
                format: function (msg, value) { // 格式化消息
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
                inputChange: function (iElement, callback, isTrim) {
                    var getValue = function (iElement, isTrim) {
                        return iElement[0].value === undefined ? '' : isTrim ? iElement[0].value.trim() : iElement[0].value;
                    };
                    var oldValue = getValue(iElement, isTrim), newValue;
                    iElement.on('compositionstart', function () {
                        oldValue = getValue(iElement, isTrim);
                    }).on('compositionend', function () {
                        newValue = getValue(iElement, isTrim);
                        if (newValue !== oldValue) {
                            callback(newValue, oldValue);
                        }
                    }).on('change keyup', function () {
                        newValue = getValue(iElement, isTrim);
                        if (newValue !== oldValue) {
                            callback(newValue, oldValue);
                            oldValue = newValue;
                        }
                    }).on('input propertychange', function () {
                        newValue = getValue(iElement, isTrim);
                        if (newValue !== oldValue) {
                            callback(newValue, oldValue);
                            oldValue = newValue;
                        }
                    });
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
                getDocument: function (elem) {
                    var element;
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
                execFunction: function (fn, args, fnName) {
                    try {
                        if (typeof fn === 'string') {
                            fn = eval(fn);
                        }
                        return fn.apply(this, args);
                    } catch (e) {
                        toolkit.loggerError("function is undefined or exec function [" + (fnName !== undefined ? fnName : '') + "] is error:", e);
                    }
                },
                loggerError: function (msg, iElement) {
                    console.group("[ngValidate Error]");
                    console.error(msg);
                    if (iElement !== undefined) {
                        console.error(iElement);
                    }
                    console.groupEnd();
                },
                loggerWarn: function (msg, iElement) {
                    console.group("[ngValidate Warn]");
                    console.warn(msg);
                    if (iElement !== undefined) {
                        console.warn(iElement);
                    }
                    console.groupEnd();
                }
            };
            return toolkit;
        }];
    });

    // 参数
    validModule.provider('parameter', function () {
        var defaults = this.defaults = {
            option: {
                required: false, // 必须验证
                regex: new RegExp(), // 正则验证
                email: false, // 邮箱验证
                url: false, // url验证
                date: '', // 日期验证
                dateFormat: '', // 日期格式验证
                phone: false, // 手机号验证
                number: false,// 有效数字验证
                digits: false, // 数字验证
                extension: [], // 后缀验证
                least: 0, // checkbox 勾选个数验证
                most: 0, // checkbox 勾选个数验证
                min: 0, // 最小数值验证
                max: 0, // 最大数值验证
                range: [], // 数值区间验证
                minLength: 0, // 最小长度验证
                maxLength: 0, // 最大长度验证
                rangeLength: [], // 长度区域验证
                method: '', // 自定义函数验证
                equalTo: '',// 是否相等验证
                remote: '' // 远程连接验证
            },
            message: {
                required: '此项为必填字段',
                regex: '该字段不符合要求',
                email: '请输入有效的电子邮件地址',
                url: '请输入有效的网址',
                date: '请输入有效的日期',
                dateFormat: '日期格式不符合{0}',
                phone: '请输入有效的手机号',
                number: '请输入有效的数字',
                digits: '只能输入数字',
                extension: '请输入有效的后缀',
                least: '至少选择 {0} 项',
                most: '最多选择 {0} 项',
                min: '请输入不小于 {0} 的数值',
                max: '请输入不大于 {0} 的数值',
                range: '请输入范围在 {0} 到 {1} 之间的数值',
                minLength: '最少要输入 {0} 个字符',
                maxLength: '最多可以输入 {0} 个字符',
                rangeLength: '请输入长度在 {0} 到 {1} 之间的字符串',
                method: '该字段不符合要求',
                equalTo: '你的输入不相同',
                remote: '请检查此字段'
            },
            setting: {
                isClose: false, // 关闭验证
                tipModel: 'tip', // 模式： tip: 悬浮提示；tail: 尾部追加.
                tipClass: 'ng-validate-tip', // tip class名称以及前缀
                tipPosition: 'bottom' // tip位置
            },
            button: {
                form: '',
                submit: '',
                disabled: false
            },
            defaultMessage: '该字段不符合要求'
        };

        this.$get = ['toolkit', function (toolkit) {
            //noinspection UnnecessaryLocalVariableJS
            var parameter = {
                assemble: function (fieldOption, messageOption, settingOption, iElement, iAttrs) {
                    var result = {};
                    var type = toolkit.toLowerCase(iAttrs.type),
                        localName = iElement[0].localName;
                    if (type === 'button' || type === 'submit' || localName === 'button') {
                        // 提交按钮，a标签请添加type为button或submit
                        var button = {};
                        angular.forEach(fieldOption, function (value, key) {
                            var defaultButton = defaults.button[key];
                            if (angular.isUndefined(defaultButton)) {
                                toolkit.loggerWarn("no find this option [" + key + "]:", iElement);
                            }
                            if (toolkit.isValid(value) && toolkit.typeOf(value, defaultButton)) {
                                this[key] = value;
                            }
                        }, button);
                        result.button = button;
                        result.element = {localName: localName, type: type};
                    } else {
                        // 验证表单
                        var options = [];
                        angular.forEach(fieldOption, function (value, key) {
                            var defaultValue = defaults.option[key];
                            if (angular.isUndefined(defaultValue)) {
                                toolkit.loggerWarn("there is no such validation for [" + key + "]:", iElement);
                            } else {
                                if (toolkit.isValid(value) && toolkit.typeOf(value, defaultValue)) {
                                    var msg = parameter.getMessage(key, value, messageOption);
                                    if (key === 'required') { // 追加至第一位
                                        this.splice(0, 0, {key: key, value: value, msg: msg});
                                        iElement.after('<i class="ng-validate-required"></i>')
                                    } else if (key === 'dateFormat') { // 日期格式化
                                        this.push({key: key, value: toolkit.getDateReg(value), msg: msg});
                                    } else if (key === 'extension') { // 后缀格式化
                                        this.push({key: key, value: toolkit.getExtensionReg(value), msg: msg});
                                    } else if (key === 'equalTo') { // 相同
                                        var elem = toolkit.getDocument(value);
                                        if (elem === undefined || elem === null || elem === false) {
                                            toolkit.loggerError('can not find dom element [' + value + ']', iElement);
                                        } else {
                                            this.push({key: key, value: elem, msg: msg});
                                        }
                                    } else {
                                        this.push({key: key, value: value, msg: msg});
                                    }
                                }
                            }
                        }, options);
                        if (options.length > 0) {
                            result.options = options;
                            result.setting = angular.extend({}, defaults.setting, settingOption);
                            result.element = {localName: localName, type: type};
                        }
                    }
                    return result;
                },
                getMessage: function (key, value, messageOption) {
                    var msg = messageOption[key] || defaults.message[key] || defaults.defaultMessage;
                    return toolkit.format(msg, value);
                }
            };
            return parameter;
        }];
    });

    // 坐标计算
    validModule.factory('$dimensions', ['$document', '$window', function ($document, $window) {

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
    validModule.provider('$tooltip', function () {
        var defaults = this.defaults = {
            tipModel: 'tip', // 模式： tip: 悬浮提示；tail: 尾部追加.
            tipClass: 'ng-validate-tip', // tip class名称以及前缀
            tipPosition: 'bottom',// tip位置
            tipTemplate: [
                '<div class="ng-validate-tip tip-in" style="display: none;">',
                '<div class="ng-validate-tip tip-arrow"></div>',
                '<span class="ng-validate-tip tip-inner"></span>',
                '</div>'
            ].join('')
        };

        this.$get = ['$rootScope', '$compile', '$timeout', '$dimensions', 'toolkit', function ($rootScope, $compile, $timeout, $dimensions, toolkit) {

            var getTipTemplate = function (tipSetting) {
                if (tipSetting.tipClass === 'ng-validate-tip') {
                    return tipSetting.tipTemplate;
                } else {
                    return tipSetting.tipTemplate.replace(/ng-validate-tip/g, tipSetting.tipClass);
                }
            };

            //noinspection UnnecessaryLocalVariableJS
            var $tooltipFactory = function (iElement, config) {
                var $tooltip = {},
                    setting = iElement.ngValidate.option.setting,
                    options = $tooltip.$options = angular.extend({}, defaults, setting),
                    template = getTipTemplate(options);

                var tooltipElement = angular.element(template),
                    tooltipLinker = $compile(tooltipElement);


                // 销毁
                $tooltip.destroy = function () {
                    tooltipElement.remove();
                };

                // 定位
                $tooltip.position = function () {
                    var elementPosition = $dimensions.getPosition(iElement[0], false),
                        tooltipWidth = iElement.prop('offsetWidth'),
                        tooltipHeight = iElement.prop('offsetHeight'),
                        tooltipPosition = $dimensions.getCalculatedOffset(options.tipPosition, elementPosition, tooltipWidth, tooltipHeight);

                    tooltipPosition.top += 'px';
                    tooltipPosition.left += 'px';

                    tooltipElement.css(tooltipPosition);

                    tooltipElement.addClass(options.tipModel + "-" + options.tipPosition);
                };

                // 显示
                $tooltip.show = function (msg) {
                    tooltipElement.find('span').text(msg);
                    tooltipElement.css({'display': 'inline'});

                };

                // 隐藏
                $tooltip.hide = function () {
                    tooltipElement.css({'display': 'none'});
                    tooltipElement.find('span').text('');
                };

                // 初始化
                $tooltip.init = function () {
                    tooltipElement.css({top: '-9999px', left: '-9999px'});
                    iElement.after(tooltipElement);
                    $timeout(this.position);
                };

                $tooltip.init();

                return $tooltip;
            };

            return $tooltipFactory;
        }];
    });

    // 验证工厂
    validModule.factory('validatorFactory', ['toolkit', '$http', function (toolkit, $http) {

        var defaultMethods = this.defaultMethods = {
            // 必须验证
            required: function (iElement, value, validParam) {
                var element = iElement.ngValidate.option.element;
                if (element.localName === 'select') {
                    return iElement[0].selectedIndex !== 0;
                } else {
                    return value !== undefined && value.length > 0;
                }
            },
            // 正则验证
            regex: function (iElement, value, validParam) {
                return value === '' || validParam.test(value);
            },
            // 邮箱验证
            email: function (iElement, value, validParam) {
                return value === '' || /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value);
            },
            // url验证
            url: function (iElement, value, validParam) {
                return value === '' || /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
            },
            // 日期验证
            date: function (iElement, value, validParam) {
                return value === '' || !/Invalid|NaN/.test(new Date(value).toString());
            },
            // 日期格式验证
            dateFormat: function (iElement, value, validParam) {
                return value === '' || validParam.test(value);
            },
            // 手机号验证
            phone: function (iElement, value, validParam) {
                return value === '' || /^1[34578]\d{9}$/.test(value);
            },
            // 有效数字验证
            number: function (iElement, value, validParam) {
                return value === '' || /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value);
            },
            // 数字验证
            digits: function (iElement, value, validParam) {
                return value === '' || /^\d+$/.test(value);
            },
            // 后缀验证
            extension: function (iElement, value, validParam) {
                return value === '' || validParam.test(value);
            },
            // checkbox 勾选最少个数验证
            least: function (iElement, value, validParam) {
                var element = iElement.ngValidate.option.element,
                    triggerType = iElement.ngValidate.triggerType;
                if (element.localName === 'select' || element.type === 'checkbox'
                    || triggerType === 'checkbox' || triggerType === 'radio') {
                    var length = angular.isArray(value) ? value.length : 1;
                    return length >= validParam;
                }
                return true;
            },
            // checkbox 勾选最多个数验证
            most: function (iElement, value, validParam) {
                var element = iElement.ngValidate.option.element,
                    triggerType = iElement.ngValidate.triggerType;
                if (element.localName === 'select' || element.type === 'checkbox'
                    || triggerType === 'checkbox' || triggerType === 'radio') {
                    var length = angular.isArray(value) ? value.length : 1;
                    return length <= validParam;
                }
                return true;
            },
            // 最小数值验证
            min: function (iElement, value, validParam) {
                return value === '' || value >= validParam;
            },
            // 最大数值验证
            max: function (iElement, value, validParam) {
                return value === '' || value <= validParam;
            },
            // 数值区间验证
            range: function (iElement, value, validParam) {
                return value === '' || ( value >= validParam[0] && value <= validParam[1] );
            },
            // 最小长度验证
            minLength: function (iElement, value, validParam) {
                return value === '' || value.length >= validParam;
            },
            // 最大长度验证
            maxLength: function (iElement, value, validParam) {
                return value === '' || value.length <= validParam;
            },
            // 长度区域验证
            rangeLength: function (iElement, value, validParam) {
                return value === '' || ( value.length >= validParam[0] && value.length <= validParam[1] );
            },
            // 自定义函数验证
            method: function (iElement, value, validParam) {
                var service = iElement.ngValidate.service;
                return service.getMethod(validParam).apply(this, [value, iElement]);
            },
            // 是否相等验证
            equalTo: function (iElement, value, validParam) {
                return value === '' || value === validParam.value;
            },
            // 远程连接验证
            remote: function (iElement, value, validParam) {
                // var promise = $http.get(validParam);
                // TODO 远程连接验证
            }
        };

        var validatorFactory = {
            create: function (iElement) {
                var option = iElement.ngValidate.option,
                    validOptions = option.options,
                    validValue = validatorFactory.getValue(iElement, true);
                var validResult = {};
                validOptions.every(function (validOption) {
                    var isValid = toolkit.execFunction(defaultMethods[validOption.key], [iElement, validValue, validOption.value], validOption.key);
                    if (!isValid) {
                        validResult = {key: validOption.key, msg: validOption.msg};
                        // TODO 扩展所有验证提示
                        return false;
                    } else {
                        return true;
                    }
                });
                return validResult;
            },
            getValue: function (iElement, isTrim) {
                var iElem = iElement,
                    iAttrs = iElement.ngValidate.iAttrs,
                    triggerType = iElement.ngValidate.triggerType,
                    triggerInput = iElement.ngValidate.triggerInput,
                    validValue;

                if (triggerType === 'checkbox' || triggerType === 'radio') {
                    var selectValue = [];
                    angular.forEach(iElem.ngValidate.triggerInput, function (value) {
                        if (value.checked) {
                            this.push(true);
                        }
                    }, selectValue);
                    return selectValue;
                }

                if (triggerInput !== undefined) {
                    // 输入框只验证第一个靠近div的input
                    iElem = triggerInput;
                }

                if (iElem[0].value !== undefined) { // 获取需要验证的值
                    // 有value的表单元素
                    validValue = iElem.val() !== null ? iElem.val() : iElem.ngValidate.modelValue;
                } else if (iAttrs.ngModel) {// 可能是非表单元素的ngModel
                    validValue = iElem.ngValidate.modelValue
                } else { // 非表单元素，比如div
                    validValue = iElem.text()
                }

                if (validValue === undefined || validValue === null) {
                    validValue = ''
                }

                if (angular.isString(validValue) && isTrim) {// 除去多余空格
                    validValue = validValue.trim();
                }
                return validValue;
            }
        };

        return validatorFactory;
    }]);

    // 验证
    validModule.provider('validator', function () {

        var eventModel = this.eventModel = {
            change: 'change', // 内容改变事件
            blur: 'blur' // 失去焦点事件
        };

        this.$get = ['toolkit', '$tooltip', 'validatorFactory', function (toolkit, $tooltip, validatorFactory) {
            var validator = {
                // 初始化
                init: function (iElement) {
                    var option = iElement.ngValidate.option;
                    validator.buildScope(iElement, option);
                    if (option.options !== undefined) { // 按钮不绑定事件
                        // TODO 扩展required时增加*号
                        validator.buildTooltip(iElement);
                        validator.bindEvent(iElement);
                    }
                },
                // 绑定提交按钮
                buildScope: function (iElement, option) {
                    var $scope = iElement.ngValidate.$scope;
                    if ($scope !== undefined) {
                        if (option.button !== undefined) {
                            $scope.ngValidate.button.push(iElement);
                            // TODO 重置按钮
                            iElement.on('click', function (e) {
                                e.preventDefault();
                                $scope.ngValidate.submit(iElement);
                            });
                        } else {
                            $scope.ngValidate.element.push(iElement);
                        }
                    }

                },
                // 生成提示dom
                buildTooltip: function (iElement) {
                    var tooltip = iElement.data('tooltip');
                    if (tooltip === undefined) {
                        tooltip = $tooltip(iElement);
                        iElement.data('tooltip', tooltip);
                    }
                    return tooltip;
                },
                // 绑定表单事件
                bindEvent: function (iElement) {
                    var scope = iElement.ngValidate.scope,
                        iAttrs = iElement.ngValidate.iAttrs;

                    if (iAttrs.ngModel) { // 元素上有ng-module, 监听它的值
                        scope.$watch(iAttrs.ngModel, function (newValue, oldValue) {
                            if (newValue !== undefined || oldValue !== undefined) {
                                // 将ngModel的值写入到modelValue, 供验证使用
                                if (!toolkit.isEmptyObject(newValue)) {
                                    // 把watch的obj对象转为用户输入类型
                                    iElement.ngValidate.modelValue = iAttrs.type === 'number' ? Number(newValue) : String(newValue);
                                } else {
                                    iElement.ngValidate.modelValue = null;
                                }

                                // 非表单元素，在改变moudel时确保有焦点，以便于触发失焦验证
                                if (iElement[0].value === undefined && toolkit.isEmptyObject(newValue)) {
                                    iElement[0].focus()
                                }

                                // ngModel 改变，触发一次 change
                                validator.eventTrigger(iElement);
                            }
                        });
                    }

                    if (iElement[0].value === undefined) { // 非表单元素
                        // 可能存在辅助input类元素。比如第三方组件可能会在<div>内用<input>模拟用户输入
                        var triggerInput = iElement[0].querySelectorAll('input');

                        if (triggerInput.length > 0) {
                            var triggerType = triggerInput[0].type;
                            // 默认非表单元素是不能触发焦点事件的，这里需要它增加一个属性tabindex
                            iElement.attr('tabindex', 0);

                            iElement.ngValidate.triggerInput = angular.element(triggerInput);

                            if (triggerType === 'checkbox' || triggerType === 'radio') {
                                // 只监听change事件
                                iElement.attr('type', triggerType);
                                iElement.ngValidate.triggerType = triggerType;
                                iElement.ngValidate.triggerInput.on(eventModel.change, function () {
                                    validator.eventTrigger(iElement);
                                });
                            } else {
                                iElement.ngValidate.triggerInput.on(eventModel.blur, function () {
                                    validator.eventTrigger(iElement);
                                });
                                toolkit.inputChange(iElement.ngValidate.triggerInput, function (newValue, oldValue) {
                                    if (newValue !== oldValue) {
                                        validator.eventTrigger(iElement);
                                    }
                                }, true);
                            }
                        }
                    } else if (iAttrs.type === 'checkbox' || iAttrs.type === 'radio') { // 单选框或复选框
                        // 只监听change事件
                        iElement.on(eventModel.change, function () {
                            validator.eventTrigger(iElement);
                        });
                    } else { // 表单元素
                        iElement.on(eventModel.blur, function () {
                            validator.eventTrigger(iElement);
                        });
                        if (!iAttrs.ngModel) {
                            toolkit.inputChange(iElement, function (newValue, oldValue) {
                                if (newValue !== oldValue) {
                                    validator.eventTrigger(iElement);
                                }
                            }, true);
                        }
                    }
                    // iElement.on('focus',function () {
                    //     console.log('已经标红时获取焦点，显示tip')
                    // });
                },
                // 表单事件触发
                eventTrigger: function (iElement) {
                    var $scope = iElement.ngValidate.$scope,
                        validResult = validator.checkField(iElement);
                    if (toolkit.isEmptyObject(validResult)) {
                        iElement.ngValidate.hasError = false;
                        iElement.removeClass('ng-validate-error').addClass('ng-validate-success');
                        validator.hideTooltip(iElement);
                        validator.enableBtn($scope);
                    } else {
                        iElement.ngValidate.hasError = true;
                        iElement.removeClass('ng-validate-success').addClass('ng-validate-error');
                        validator.showTooltip(iElement, validResult);
                        validator.disableBtn($scope);
                    }
                    return validResult;
                },
                // 检查属性
                checkField: function (iElement) {
                    return validatorFactory.create(iElement);
                },
                // 检查作用域下所有属性
                checkAllField: function ($scope) {
                    var validElements = $scope.ngValidate.element,
                        validResult = [];
                    angular.forEach(validElements, function (iElem) {
                        var vaildResult = validator.eventTrigger(iElem);
                        if (!toolkit.isEmptyObject(vaildResult)) {
                            this.push(false);
                        }
                    }, validResult);
                    return validResult.length === 0;
                },
                checkAllHasError: function ($scope) {
                    var validElements = $scope.ngValidate.element,
                        hasError = [];
                    angular.forEach(validElements, function (iElem) {
                        if (iElem.ngValidate.hasError) {
                            this.push(true);
                        }
                    }, hasError);
                    return hasError.length === 0;
                },
                // 显示信息
                showTooltip: function (iElement, validResult) {
                    var tooltip = validator.buildTooltip(iElement);
                    tooltip.show(validResult.msg);
                },
                // 隐藏信息
                hideTooltip: function (iElement) {
                    var tooltip = validator.buildTooltip(iElement);
                    tooltip.hide();
                },
                // 启用按钮
                enableBtn: function ($scope) {
                    validator.buttonHandle($scope, false);
                },
                // 禁用按钮
                disableBtn: function ($scope) {
                    validator.buttonHandle($scope, true);
                },
                buttonHandle: function ($scope, isDisable) {
                    var button = $scope.ngValidate.button;
                    if (button !== undefined && button.length > 0) {
                        angular.forEach(button, function (btn) {
                            var btnSetting = btn.ngValidate.option.button;
                            if (btnSetting !== undefined && btnSetting.disabled) {
                                var hasError = validator.checkAllHasError($scope);
                                btn.prop('disabled', isDisable && !hasError);
                            }
                        })
                    }
                }
            };
            return validator;
        }];
    });

    // 父指令. 填写在form表单上
    validModule.directive('ngValidateScope', function () {
        return {
            restrict: 'A',
            require: 'form',
            scope: true, //{}:全新隔离的作用域，true:继承父作用域并创建自己的作用域，false:继承父作用域
            priority: 3,
            controller: ['$scope', '$element', '$attrs', 'toolkit', 'validator', function ($scope, $element, $attrs, toolkit, validator) {

                var checkAll = $scope.checkAll = function () {
                    var validElements = $scope.ngValidate.element,
                        validResult = [];
                    angular.forEach(validElements, function (iElem) {
                        var vaildResult = validator.eventTrigger(iElem);
                        if (!toolkit.isEmptyObject(vaildResult)) {
                            this.push(false);
                        }
                    }, validResult);
                    return validResult.length === 0;
                };

                // 初始化验证参数
                $scope.ngValidate = {
                    element: [], // 表单元素
                    button: [], // 提交按钮
                    submit: function (iElement) {
                        var button = iElement.ngValidate.option.button;
                        var validElements = $scope.ngValidate.element;
                        var isCheck = checkAll();
                        if (angular.isDefined(button.submit)) {
                            toolkit.execFunction($scope[button.submit], [isCheck, validElements], button.submit);
                        }
                    }
                };
                this.getScope = function () {
                    return $scope;
                };
                $element[0]._ngValidateScope = $scope;
            }],
            link: function postLink(scope, iElement, iAttrs, controller) {
                iElement.attr('novalidate', 'novalidate');// 禁用HTML5自带验证
                iElement.attr('autocomplete', 'off');// 禁用autocomplete
            }
        }
    });

    // 子指令-设置信息. 填写在表单字段元素上或表单字段父级元素上
    validModule.directive('ngValidateSetting', ['toolkit', function (toolkit) {
        return {
            restrict: 'A',
            require: '?^ngValidateScope',
            scope: false,
            priority: 3,
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                var settingOption = toolkit.formatOption($attrs.ngValidateSetting, $element);
                this.getSettingOption = function () {
                    return settingOption;
                };
            }]
        }
    }]);

    // 子指令-提示信息. 填写在表单字段元素上或表单字段父级元素上
    validModule.directive('ngValidateMessage', ['toolkit', function (toolkit) {
        return {
            restrict: 'A',
            require: '?^ngValidateScope',
            scope: false,
            priority: 2,
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                var messageOption = toolkit.formatOption($attrs.ngValidateMessage, $element);
                this.getMessageOption = function () {
                    return messageOption;
                };
            }]
        }
    }]);

    // 子指令-字段验证. 填写在表单字段元素上或表单提交按钮上
    validModule.directive('ngValidate', ['$timeout', 'toolkit', 'parameter', 'validator', 'ngValidate', function ($timeout, toolkit, parameter, validator, ngValidateService) {
        return {
            restrict: 'A',
            require: ['?^ngValidateScope', '?^ngValidateSetting', '?^ngValidateMessage'],
            scope: true,
            priority: 1,
            link: function postLink(scope, iElement, iAttrs, controllers) {
                // 延迟加载,确保ngValidateScope，ngValidateSetting,ngValidateMessage初始化完毕
                $timeout(function () {

                    var ngValidateScopeCtrl = controllers[0], // 父指令控制器
                        ngValidateSettingCtrl = controllers[1], // 设置控制器
                        ngValidateMessageCtrl = controllers[2]; // 消息控制器

                    var parentScope; // 父指令的$scope

                    var fieldOption = toolkit.formatOption(iAttrs.ngValidate, iElement), // 获取传入的参数
                        messageOption = ngValidateMessageCtrl === null ? {} : ngValidateMessageCtrl.getMessageOption(),
                        settingOption = ngValidateSettingCtrl === null ? {} : ngValidateSettingCtrl.getSettingOption();

                    var option = parameter.assemble(fieldOption, messageOption, settingOption, iElement, iAttrs);

                    // ngValidate缺少验证信息时，控制台警告并跳过验证
                    if (toolkit.isEmptyObject(fieldOption) && toolkit.isEmptyObject(option)) {
                        toolkit.loggerWarn('ng-validate validate info has missing and skip validate:', iElement);
                        return;
                    }

                    // 绑定隐藏属性
                    iElement[0]._ngValidateOption = option;

                    if (ngValidateScopeCtrl !== null) { // 在父作用域内
                        parentScope = ngValidateScopeCtrl.getScope();
                    } else { // 在父作用域外
                        if (!fieldOption.form) { // 动态表单，不在作用域内，但是仍想绑定在某一作用域下
                            // TODO 不在作用域，单个表单处理
                            return;
                        }

                        parentScope = ngValidateService.scope(fieldOption.form);
                        if (parentScope === undefined) {
                            toolkit.loggerError('ngValidate button can not be find form [' + fieldOption.form + ']:', iElement);
                            return;
                        }
                    }

                    // 元素绑定相关参数
                    iElement.ngValidate = {
                        $scope: parentScope,
                        scope: scope,
                        iAttrs: iAttrs,
                        service: ngValidateService,
                        option: option
                    };
                    validator.init(iElement);
                });
            }
        }
    }]);

    return validModule;
}));