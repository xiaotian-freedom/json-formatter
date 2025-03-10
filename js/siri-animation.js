/**
 * Siri 风格动画效果模块
 * 提供 iOS 18 风格的 Siri 动画效果
 */

// 显示 Siri 动画效果
function showSiriEffect(element) {
    // 如果没有传入元素，使用默认选择器
    const targetElement = element || document.querySelector('.json-container');
    if (!targetElement) return;

    // 创建 Siri 效果容器
    const siriEffect = document.createElement('div');
    siriEffect.className = 'ts-siri-effect';
    siriEffect.id = 'siriAnimationEffect';

    // 创建 Siri 波浪效果
    const siriWave = document.createElement('div');
    siriWave.className = 'ts-siri-wave';

    // 添加到 DOM
    siriEffect.appendChild(siriWave);
    targetElement.appendChild(siriEffect);

    // 确保目标元素有相对定位，以便正确显示动画
    const currentPosition = window.getComputedStyle(targetElement).position;
    if (currentPosition === 'static') {
        targetElement.style.position = 'relative';
    }

    // 激活动画
    targetElement.classList.add('ts-siri-active');

    return siriEffect;
}

// 隐藏 Siri 动画效果
function hideSiriEffect(element) {
    // 如果没有传入元素，使用默认选择器
    const targetElement = element || document.querySelector('.json-container');
    if (!targetElement) return;

    const siriEffect = document.getElementById('siriAnimationEffect');

    // 移除激活类
    targetElement.classList.remove('ts-siri-active');

    // 如果效果元素存在，则移除
    if (siriEffect) {
        // 使用 setTimeout 以允许淡出效果完成
        setTimeout(() => {
            siriEffect.remove();
        }, 2000);
    }
}

// 执行带 Siri 动画的操作
function withSiriAnimation(element, actionFn, duration = 800) {
    return new Promise((resolve) => {
        // 显示动画
        showSiriEffect(element);

        // 设置超时以确保动画效果可见
        setTimeout(() => {
            // 执行操作
            const result = actionFn();

            // 隐藏动画
            hideSiriEffect(element);

            // 返回结果
            resolve(result);
        }, duration);
    });
}

// 导出函数供其他模块使用
window.SiriAnimation = {
    showEffect: showSiriEffect,
    hideEffect: hideSiriEffect,
    withAnimation: withSiriAnimation
}; 