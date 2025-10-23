// =================================================================
// 全域變數和資料接收
// -----------------------------------------------------------------

let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; 
let fireworks = []; // 儲存所有的煙火實例
let gravity;        // 重力向量
let p5Canvas;       // 關鍵：儲存 p5.js Canvas 實例

window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score;
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // 關鍵修正 1: 顯示 p5.js 畫面
        if (p5Canvas) {
            p5Canvas.style('display', 'block');
        }
        
        // 關鍵修正 2: 根據分數啟動或停止連續繪製 (loop/noLoop)
        let percentage = (finalScore / maxScore) * 100;
        
        if (percentage >= 90) {
            loop(); // 90分以上，開始循環繪製 (以運行煙火動畫)
        } else {
            noLoop(); // 低於 90分，停止循環繪製 (只繪製一次靜態畫面)
            redraw(); // 確保靜態畫面更新
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

// Particle 類別：構成煙火爆炸後的每一個點
class Particle {
    constructor(x, y, hue, firework) {
        this.pos = createVector(x, y);
        this.firework = firework; 
        this.lifespan = 255;
        this.hue = hue;
        
        if (this.firework) {
            this.vel = createVector(random(-1.5, 1.5), random(-10, -18)); // 修正 X 速度範圍
        } else {
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10));
        }
        this.acc = createVector(0, 0);
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.firework) {
            this.vel.mult(0.9);
            this.lifespan -= 4;
        }
        
        this.applyForce(gravity);
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }

    show() {
        // 使用 HSB 模式的 stroke 顏色，透明度使用 HSB 的第四個參數 (0-1)
        if (!this.firework) {
            strokeWeight(2);
            stroke(this.hue, 100, 100, this.lifespan / 255); // lifespan / 255 將 0-255 轉換為 0-1
        } else {
            strokeWeight(4);
            stroke(this.hue, 100, 100);
        }
        point(this.pos.x, this.pos.y);
    }
    
    isDead() {
        return this.lifespan < 0;
    }
}

// Firework 類別：管理單個煙火從發射到爆炸的生命週期
class Firework {
    constructor() {
        this.hue = random(360); 
        this.firework = new Particle(random(width), height, this.hue, true); 
        this.exploded = false;
        this.particles = [];
    }
    
    explode() {
        for (let i = 0; i < 100; i++) {
            let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hue, false);
            this.particles.push(p);
        }
    }

    update() {
        if (!this.exploded) {
            this.firework.update();
            if (this.firework.vel.y >= 0) { 
                this.exploded = true;
                this.explode();
            }
        } else {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                if (this.particles[i].isDead()) {
                    this.particles.splice(i, 1);
                }
            }
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show();
        } else {
            for (let p of this.particles) {
                p.show();
            }
        }
    }
    
    done() {
        return this.exploded && this.particles.length === 0;
    }
}


function setup() { 
    // 使用 windowWidth 和 windowHeight 的一半作為畫布尺寸，並儲存實例
    p5Canvas = createCanvas(windowWidth / 2, windowHeight / 2); 
    
    // 關鍵修正 3: 定位和初始隱藏
    // 設置為固定定位 (fixed)，使其浮動在所有內容之上
    p5Canvas.style('position', 'fixed');
    // 居中對齊
    p5Canvas.style('top', '50%');
    p5Canvas.style('left', '50%');
    p5Canvas.style('transform', 'translate(-50%, -50%)');
    // 設置高層級，確保在 H5P 之上
    p5Canvas.style('z-index', '1000');
    // 初始隱藏
    p5Canvas.style('display', 'none'); 

    // 啟用 HSB 色彩模式 (H: 0-360, S: 0-100, B: 0-100, Alpha: 0-1)
    colorMode(HSB, 360, 100, 100, 1); 
    
    gravity = createVector(0, 0.2); 
    background(0); 
    noLoop(); 
} 

function draw() { 
    // 使用半透明的黑色背景，製造拖影效果 (Alpha 設為 0.2)
    background(0, 0, 0, 0.2); 

    let percentage = (finalScore / maxScore) * 100;

    // --- 煙火邏輯 ---
    if (percentage >= 90) {
        // 每 10 幀有 10% 的機率發射新煙火
        if (frameCount % 10 === 0 && random(1) < 0.1) {
            fireworks.push(new Firework());
        }
    }
    
    // 更新並顯示所有煙火
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].show();
        
        // 移除已結束的煙火
        if (fireworks[i].done()) {
            fireworks.splice(i, 1);
        }
    }
    // ----------------------
    
    // 畫面中央的文字與幾何圖形顯示 
    
    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (顏色值已修正為 HSB 範圍 0-360, 0-100, 0-100)
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 滿分或高分：HSB 綠色 (H:120, S:100, B:80)
        fill(120, 100, 80);
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
    } else if (percentage >= 60) {
        // 中等分數：HSB 黃色 (H:40, S:86, B:100)
        fill(40, 86, 100);
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：HSB 紅色 (H:0, S:100, B:80)
        fill(0, 100, 80);
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0：HSB 灰色 (H:0, S:0, B:60)
        fill(0, 0, 60);
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    // 白色文字 (H:0, S:0, B:100)
    fill(0, 0, 100);
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (顏色值已修正)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 畫一個大圓圈代表完美 (HSB 綠色 + 0.6 透明度)
        fill(120, 100, 80, 0.6); 
        noStroke();
        circle(width / 4, height - 100, 100); 
        
    } else if (percentage >= 60) {
        // 畫一個方形 (HSB 黃色 + 0.6 透明度)
        fill(40, 86, 100, 0.6);
        rectMode(CENTER);
        rect(width / 2, height - 100, 100, 100); 
    }
    
}
