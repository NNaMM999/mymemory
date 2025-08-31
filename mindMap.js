class mindMap {

    domId;
    nodes;
    edges;

    constructor(domId, data,tool) {

        this.nodes = data.nodes;
        this.edges = data.edges;
        this.domId = domId;

        // 縦横の小さいほうを基準に円形配置する
        const size = this.domId.offsetWidth < this.domId.offsetHeight ? this.domId.offsetWidth : this.domId.offsetHeight;
        const centerX = this.domId.offsetWidth / 2; 
        const centerY = this.domId.offsetHeight / 2;
        const radius = size / 3;
        this.nodes.forEach((node, i) => {
            const angle = (2 * Math.PI * i) / this.nodes.length;
            node.x = centerX + radius * Math.cos(angle);
            node.y = centerY + radius * Math.sin(angle);

            // ノードDOMを作成
            const div = document.createElement("div");
            div.className = "node";
            div.id = node.id;
            div.textContent = node.label;
            div.style.width = div.style.height = (node.value * 40) + "px"; // valueでサイズ調整
            div.style.left = node.x + "px";
            div.style.top = node.y + "px";
            
            div.addEventListener("click",() => {tool(node.label)});

            domId.appendChild(div);
        });

        this.domId.appendChild(this.drawEdges());


    }


    drawEdges() {
        const canvas = document.createElement("canvas");
        canvas.width = 1920;
        canvas.height = 1920;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.edges.forEach(edge => {
            const from = this.nodes.find(n => n.id === edge.from);
            const to = this.nodes.find(n => n.id === edge.to);

            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.strokeStyle = "rgba(255,255,255,0.5)";
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        return canvas;
    }



    destroy() {
        this.domId.replaceChildren();
    }


}