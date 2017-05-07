class App {
    constructor() {
        this.canvas = document.getElementById('scene');
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.assassins = [];
        this.initialBoard = [];

        this.createAssassin = this.createAssassin.bind(this);
        this.setCamera = this.setCamera.bind(this);
        this.setLight = this.setLight.bind(this);
        this.renderMenu = this.renderMenu.bind(this);
        this.setPage = this.setPage.bind(this);
        this.clearInitialBoard = this.clearInitialBoard.bind(this);
        this.renderInitialBoard = this.renderInitialBoard.bind(this);
    }

    initializeScene() {
        const {
            canvas,
            engine,
            createAssassin,
            setLight,
            renderMenu,
            setPage,
            generateBoardCoodinates
        } = this;

        // create the scene
        this.scene = new BABYLON.Scene(engine);

        const { scene } = this;

        // set scene background color
        scene.clearColor = new BABYLON.Color3(0.9, 0.9, 0.9);

        // initialize lighting
        setLight();

        // render first screen
        renderMenu();
        setPage('menu');

        engine.runRenderLoop(function() {
            scene.render();
        });
    }

    createAssassin(pos) {
        const { scene } = this;

        BABYLON.SceneLoader.ImportMesh(
            '',
            'models/assassin/',
            'vanguard-assassin.babylon',
            scene,
            (newMeshes, particleSystems, skeletons) => {
                this.assassins.push(newMeshes);

                newMeshes[0].position = pos;
                newMeshes.forEach(mesh => {
                    mesh.material = new BABYLON.StandardMaterial(
                        'Material01',
                        scene
                    );
                });
            }
        );
    }

    setCamera(pos, look, shouldControl) {
        let { camera, scene, canvas } = this;

        if (this.camera) {
            this.camera.dispose();
        }

        this.camera = new BABYLON.ArcRotateCamera(
            'camera',
            0,
            0,
            0,
            look,
            scene
        );

        this.camera.setPosition(pos);

        if (shouldControl) {
            this.camera.attachControl(canvas, false, true);
        }
    }

    setLight() {
        const { scene } = this;

        this.light2 = new BABYLON.HemisphericLight(
            'light',
            new BABYLON.Vector3(0, 1, 0),
            scene
        );

        this.light2.intensity = 0.1;

        this.light = new BABYLON.DirectionalLight(
            'light',
            new BABYLON.Vector3(0, -2, 2),
            scene
        );
        this.light.intensity = 1;
    }

    renderMenu() {
        const { createAssassin } = this;

        createAssassin(new BABYLON.Vector3(0, 0, 0));
        createAssassin(new BABYLON.Vector3(-1.6, 0, 2));
        createAssassin(new BABYLON.Vector3(1.3, 0, 1));
    }

    clearInitialBoard() {
        for(let i = 0; i < this.initialBoard.length; i++) {
            this.initialBoard[i].dispose();
        }

        this.initialBoard = [];
    }

    renderInitialBoard(n) {
        const { scene, generateBoardCoodinates, clearInitialBoard, setCamera, createAssassin } = this;

        clearInitialBoard();

        let coordinates = generateBoardCoodinates(n, new BABYLON.Vector3(-100, 0, -12));

        for(let i = 0; i < n; i++) {
            for(let j = 0; j < n; j++) {
                let board = BABYLON.Mesh.CreateBox('box' + coordinates[i][j].x + coordinates[i][j].z, 2, scene, false);

                board.position.x = coordinates[i][j].x;
                board.position.y = coordinates[i][j].y;
                board.position.z = coordinates[i][j].z;
                board.scaling.y = 0.2;
                board.material = new BABYLON.StandardMaterial(
                    'board_material',
                    scene
                );

                board.material.alpha = 0.8;

                const offset = i % 2 ? 1 : 0;

                if((j + offset) % 2 == 0) {
                    board.material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
                }
                else {
                    board.material.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
                }

                this.initialBoard.push(board);
            }
        }

        setCamera(
            new BABYLON.Vector3(-100, 13 + (n * 1.5), -25 - (n * 1.5)),
            new BABYLON.Vector3(-100, 0, -12)
        );
    }

    setPage(page) {
        const { setCamera, renderInitialBoard } = this;

        const pageRootElement = document.getElementById('page-container');

        Array.from(pageRootElement.children).forEach(page => {
            page.style.display = 'none';
        });

        if(page === 'menu') {
            const menuOverlay = document.getElementById('menu-page');
            menuOverlay.style.display = 'flex';
            
            setCamera(
                new BABYLON.Vector3(-0.3, 1.4, -1.9),
                new BABYLON.Vector3(0, 1.4, 0)
            );
        }
        else if(page === 'input-n') {
            const inputNOverlay = document.getElementById('input-n-page');
            inputNOverlay.style.display = 'flex';

            setCamera(
                new BABYLON.Vector3(-100, 13, -25),
                new BABYLON.Vector3(-100, 0, -12)
            );
        }
    }

    generateBoardCoodinates(n, pos) {
        const size = 2;
        const center = (n - 1) / 2;
        const coordinates = [];

        for(let i = 0; i < n; i++) {
            const row = [];

            for(let j = 0; j < n; j++) {
                row.push(new BABYLON.Vector3(
                    pos.x - (size * (center - j)),
                    pos.y,
                    pos.z - (size * (center - i))
                ));
            }   

            coordinates.push(row);
        }

        return coordinates;
    }
}

const AppInstance = new App();

AppInstance.initializeScene();

const startBtn = document.getElementById('start-btn');

startBtn.onclick = () => {
    AppInstance.setPage('input-n');
};

const nInput = document.getElementById('n-input');

nInput.onkeyup = () => {
    AppInstance.renderInitialBoard(parseInt(nInput.value));
};