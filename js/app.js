class App {
    constructor() {
        this.canvas = document.getElementById('scene');
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.menuAssassins = [];
        this.initialBoard = [];
        this.n = 0;
        this.state = 'menu';
        this.assassinMesh = null;

        this.createAssassin = this.createAssassin.bind(this);
        this.setCamera = this.setCamera.bind(this);
        this.setLight = this.setLight.bind(this);
        this.renderMenu = this.renderMenu.bind(this);
        this.setPage = this.setPage.bind(this);
        this.clearInitialBoard = this.clearInitialBoard.bind(this);
        this.renderInitialBoard = this.renderInitialBoard.bind(this);
        this.setN = this.setN.bind(this);
        this.toggleAssassin = this.toggleAssassin.bind(this);
        this.fetchAssassinModel = this.fetchAssassinModel.bind(this);
        this.clearMenuAssassins = this.clearMenuAssassins.bind(this);
        this.clearInitialBoard = this.clearInitialBoard.bind(this);
    }

    fetchAssassinModel() {
        const { scene } = this;

        return new Promise((resolve, reject) => {
            BABYLON.SceneLoader.ImportMesh(
                '',
                'models/assassin/',
                'vanguard-assassin.babylon',
                scene,
                (newMeshes, particleSystems, skeletons) => {
                    newMeshes.forEach((mesh) => {
                        if(mesh.material) {
                            mesh.isPickable = false;
                            mesh.material.dispose();
                            mesh.material = null;
                        }

                        mesh.visibility = false;
                    });

                    this.assassinMesh = newMeshes[0].clone();

                    resolve(newMeshes);
                }
            );
        });
        
    }

    initializeScene() {
        const {
            canvas,
            engine,
            createAssassin,
            setLight,
            renderMenu,
            setPage,
            generateBoardCoodinates,
            fetchAssassinModel
        } = this;

        // create the scene
        this.scene = new BABYLON.Scene(engine);

        // fetch model
        fetchAssassinModel()
            .then(() => {
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
            });
    }

    createAssassin(pos) {
        const { scene, assassinMesh } = this;

        // const assassin = assassinMesh.map((mesh, i) => mesh.clone('i' + i));

        const assassin = assassinMesh.clone();

        assassin.metadata = {
            type: 'assassin'
        };
        assassin.position = pos;

        assassin.material = new BABYLON.StandardMaterial(
            'Material',
            scene
        );
        assassin.material.diffuseColor = new BABYLON.Color3(1, 1, 1);

        const children = assassin.getChildMeshes(false);

        children.forEach(child => {
            child.visibility = true;
        });

        return assassin;
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
            this.camera.upperBetaLimit = 1.2;
            this.camera.lowerRadiusLimit = 5;
            this.camera.upperRadiusLimit = this.camera.radius * 2;
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
        this.light.intensity = 0.7;
    }

    renderMenu() {
        const { createAssassin, menuAssassins } = this;

        menuAssassins.push(createAssassin(new BABYLON.Vector3(0, 0, 0)));
        menuAssassins.push(createAssassin(new BABYLON.Vector3(-1.6, 0, 2)));
        menuAssassins.push(createAssassin(new BABYLON.Vector3(1.3, 0, 1)));
    }

    clearMenuAssassins() {
        this.menuAssassins.forEach(assassin => {
            assassin.dispose();
        });

        this.menuAssassins = [];
    }

    clearInitialBoard() {
        const { disposeAssassin } = this;

        this.initialBoard.forEach(cell => {
            if(cell.metadata.assassin) {
                cell.metadata.assassin = disposeAssassin(cell.metadata.assassin);
            }

            cell.dispose();
        });

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
                board.metadata = {
                    type: 'board',
                    assassin: null
                };

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
        const { setCamera, renderInitialBoard, focusBoard, clearMenuAssassins, clearInitialBoard, renderMenu } = this;

        const pageRootElement = document.getElementById('page-container');

        Array.from(pageRootElement.children).forEach(page => {
            page.style.display = 'none';
        });

        this.state = page;

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

            clearMenuAssassins();
        }
        else if(page === 'initial-placement') {
            const initialPlacementOverlay = document.getElementById('initial-placement-page');
            initialPlacementOverlay.style.display = 'flex';

            const { n } = this;

            focusBoard(this.initialBoard);

            setCamera(
                new BABYLON.Vector3(-100, 13 + (n * 1.5), -25 - (n * 1.5)),
                new BABYLON.Vector3(-100, 0, -12),
                true
            );
        }
        else if(page === 'solving') {
            const solvingOverlay = document.getElementById('solving-page');
            solvingOverlay.style.display = 'flex';

            clearInitialBoard();
        }
    }

    focusBoard(board) {
        board.forEach(mesh => {
            mesh.material.alpha = 1;
        });
    }

    setN(n) {
        this.n = n;
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

    toggleAssassin(mesh) {
        const { createAssassin, disposeAssassin } = this;

        if(mesh.metadata.assassin) {
            mesh.metadata.assassin = disposeAssassin(mesh.metadata.assassin);
        }
        else {
            mesh.metadata.assassin = createAssassin(
                new BABYLON.Vector3(mesh.position.x, mesh.position.y + 0.2, mesh.position.z)
            );
        }
    }

    disposeAssassin(assassin) {
        assassin.dispose();

        return null;
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
    const n = parseInt(nInput.value);
    AppInstance.renderInitialBoard(n);
    AppInstance.setN(n);
};

const nInputBtn = document.getElementById('n-input-btn');

nInputBtn.onclick = () => {
    AppInstance.setPage('initial-placement');
};

const solveBtn = document.getElementById('solve-btn');

solveBtn.onclick = () => {
    AppInstance.setPage('solving');
};

window.addEventListener('click', (e) => {
    const { scene, state } = AppInstance;

    if(state === 'initial-placement') {
        const pickResult = scene.pick(scene.pointerX, scene.pointerY);

        if(pickResult.hit) {
            e.preventDefault();

            const mesh = pickResult.pickedMesh;

            AppInstance.toggleAssassin(mesh);
        }
    }
});