// =================================================================
// 全域變數和資料接收
// -----------------------------------------------------------------
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; 
let fireworks = []; // 用於管理煙火特效的全域陣列

// H5P 分數接收事件監聽
window.addEventListener('message', function (event) {
    // ... 執行來源驗證...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        const previousPercentage = maxScore > 0 ? (finalScore / maxScore) * 100 : 0;
        
        finalScore = data.score;
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        const newPercentage = maxScore > 0 ? (finalScore / maxScore) * 100 : 0;
        
        // 如果分數從 < 90 跳到 >= 90，則清除舊煙火並準備發射新煙火
        if (newPercentage >= 90 && previousPercentage < 90) {
            fireworks = []; 
        }

        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// P5.JS 核心函數
// -----------------------------------------------------------------

function setup() { 
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(0); // 黑色背景 (煙火效果更明顯)
    colorMode(HSB, 255); // 關鍵：設定顏色模式為 HSB (Hue, Saturation, Brightness)，範圍 0-255
    // noLoop() 註解，讓 draw() 連續執行以呈現動畫
} 

function draw() { 
    // 為了煙火軌跡效果，背景用低透明度重新繪製 (0, 25)，產生殘影效果
    background(0, 0, 0, 25); 

    let percentage = (finalScore / maxScore) * 100;

    textSize(80); 
    textAlign(CENTER);
    
    // --- A. 根據分數區間改變文本顏色和內容 ---
    
    if (percentage >= 90) {
        // HSB 亮綠色: H:90, S:255, B:200
        fill(90, 255, 200); 
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
        // !!! 煙火發射邏輯 !!!
        // 每幀以一定的機率（例如 4%）發射一個新的煙火。
        if (random(1) < 0.04) {
            fireworks.push(new Firework()); 
        }
        
    } else if (percentage >= 60) {
        // HSB 亮黃色: H:40, S:220, B:255
        fill(40, 220, 255); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // HSB 紅色: H:0, S:255, B:200
        fill(0, 255, 200); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // HSB 灰色: H:0, S:0, B:150
        fill(0, 0, 150);
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    // HSB 深灰黑色: H:0, S:0, B:50
    fill(0, 0, 50);
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // --- B. 根據分數觸發不同的幾何圖形反映 ---
    
    if (percentage >= 90) {
        // HSB 亮綠色 + 150 透明度
        fill(90, 255, 200, 150); 
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        // HSB 亮黃色 + 150 透明度
        fill(40, 220, 255, 150);
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
    
    // --- C. 煙火動畫更新與繪製 ---
    
    // 遍歷所有煙火，更新其狀態並繪製
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();  
        fireworks[i].show();
        
        if (fireworks[i].isFinished()) {
            // 如果煙火完成，則從陣列中移除
            fireworks.splice(i, 1);
        }
    }
}


// =================================================================
// 步驟三：煙火粒子系統定義 (Firework 和 Particle 類別)
// **重要：這些類別必須定義在全域範圍，不能在 setup 或 draw 函數內部**
// -----------------------------------------------------------------

// 全域重力向量
const gravity = 0.2; 

// 粒子類別 (Particle Class) - 構成爆炸碎片
class Particle {
    constructor(x, y, hu, firework) {
        this.pos = createVector(x, y);
        this.firework = firework; 
        this.lifespan = 255; 
        this.hu = hu; // HSB 顏色 (Hue)
        
        if (this.firework) {
            // 火箭向上發射
            this.vel = createVector(random(-1.5, 1.5), random(-10, -15));
        } else {
            // 爆炸碎片向外發散
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10)); // 隨機速度
        }
        this.acc = createVector(0, 0);
    }

    // 施加力 (例如重力)
    applyForce(force) {
        this.acc.add(force);
    }

    // 更新粒子狀態
    update() {
        if (!this.firework) {
            // 碎片會衰減並受到重力影響
            this.vel.mult(0.95); // 摩擦力/空氣阻力
            this.lifespan -= 4; // 壽命減少
            this.applyForce(createVector(0, gravity));
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 清除加速度
    }

    // 判斷粒子是否結束
    isFinished() {
        return this.lifespan < 0;
    }

    // 繪製粒子
    show() {
        // 由於 setup() 中已設定 colorMode(HSB, 255)，這裡不需要切換顏色模式
        
        if (!this.firework) {
            // 碎片
            strokeWeight(2);
            // HSB(hu, 255, 255, lifespan) - 高飽和、高亮度、逐漸透明
            stroke(this.hu, 255, 255, this.lifespan);
        } else {
            // 火箭
            strokeWeight(4);
            stroke(this.hu, 255, 255);
        }
        point(this.pos.x, this.pos.y);
    }
}

// 煙火類別 (Firework Class) - 代表一個完整的煙火從發射到爆炸
class Firework {
    constructor() {
        this.hu = random(255); // 隨機顏色 (0-255)
        // 火箭粒子在畫布底部隨機位置發射
        this.firework = new Particle(random(width), height, this.hu, true); 
        this.exploded = false;
        this.particles = [];
    }

    // 檢查煙火是否完成 (火箭爆炸且所有碎片都消失)
    isFinished() {
        return (this.exploded && this.particles.length === 0);
    }

    // 爆炸
    explode() {
        // 產生 100 個碎片粒子
        for (let i = 0; i < 100; i++) {
            let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
            this.particles.push(p);
        }
    }

    // 更新煙火狀態
    update() {
        if (!this.exploded) {
            this.firework.update();

            // 如果火箭速度開始向下 (到達最高點)
            if (this.firework.vel.y >= 0) {
                this.exploded = true;
                this.explode();
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].isFinished()) {
                this.particles.splice(i, 1);
            }
        }
    }

    // 繪製煙火
    show() {
        if (!this.exploded) {
            this.firework.show();
        }

        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].show();
        }
    }
}
