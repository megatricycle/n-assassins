// const solver = require('./helpers/solver');
const solver = require('./solver2');

class App {
    constructor() {
        // this is where we set some class wide attributes
        this.canvas = document.getElementById('scene');
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.menuAssassins = [];
        this.initialBoard = []; // 3d models
        this.initialBoardState = []; // data representation of placement board
        this.solutions = []; // save the solutions solved here
        this.solutionBoard = null; // save the solutions board here, not the actual solutions from our algo
        this.n = 0;
        this.state = 'menu';
        this.assassinMesh = null;
        this.solutionIndex = 0; // current solution being seen by user

        // if your methods need access to the class, bind it here
        this.createAssassin = this.createAssassin.bind(this);
        this.setCamera = this.setCamera.bind(this);
        this.setLight = this.setLight.bind(this);
        this.renderMenu = this.renderMenu.bind(this);
        this.setPage = this.setPage.bind(this);
        this.clearInitialBoard = this.clearInitialBoard.bind(this);
        this.renderBoard = this.renderBoard.bind(this);
        this.renderInitialBoard = this.renderInitialBoard.bind(this);
        this.setN = this.setN.bind(this);
        this.toggleAssassin = this.toggleAssassin.bind(this);
        this.fetchAssassinModel = this.fetchAssassinModel.bind(this);
        this.clearMenuAssassins = this.clearMenuAssassins.bind(this);
        this.clearInitialBoard = this.clearInitialBoard.bind(this);
        this.renderSolutions = this.renderSolutions.bind(this);
        this.focusSolution = this.focusSolution.bind(this);
        this.focusBoard = this.focusBoard.bind(this);
        this.blurBoard = this.blurBoard.bind(this);
        this.backSolution = this.backSolution.bind(this);
        this.nextSolution = this.nextSolution.bind(this);
        this.clearSolutions = this.clearSolutions.bind(this);
        this.clearSolutionBoard = this.clearSolutionBoard.bind(this);
        this.solve = this.solve.bind(this);
        this.initializePlacementBoard = this.initializePlacementBoard.bind(this);
        this.showSolution = this.showSolution.bind(this);

    }

    // fetches the 3d model from server (or file system) and saves it on assassinMesh, this will be used for generating assassin models
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
                            // make it unpickable
                            mesh.isPickable = false;

                            // remove the texture
                            mesh.material.dispose();
                            mesh.material = null;
                        }

                        // hide the original model loaded fom server
                        mesh.visibility = false;
                    });

                    // save to assassinMesh
                    this.assassinMesh = newMeshes[0].clone();

                    resolve(newMeshes);
                }
            );
        });

    }

    // the very start of our 3d world
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
                setPage('menu');

                // run the render loop
                engine.runRenderLoop(function() {
                    scene.render();
                });
            });
    }

    // creates an assassin model on a BABYLON.Vector3
    createAssassin(pos) {
        const { scene, assassinMesh } = this;

        const assassin = assassinMesh.clone();

        assassin.metadata = {
            type: 'assassin'
        };
        assassin.position = pos;

        const children = assassin.getChildMeshes(false);

        children.forEach(child => {
            child.visibility = true;

            child.material = new BABYLON.StandardMaterial(
                'Material',
                scene
            );
        });

        return assassin;
    }

    // sets the camera from pos (Vector3) looking at look (Vector3). shouldControl should be set to true if we want to make the camera movable
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

    // sets up lighting
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

    // render the 3 assassins at menu
    renderMenu() {
        const { createAssassin, menuAssassins } = this;

        menuAssassins.push(createAssassin(new BABYLON.Vector3(0, 0, 0)));
        menuAssassins.push(createAssassin(new BABYLON.Vector3(-1.6, 0, 2)));
        menuAssassins.push(createAssassin(new BABYLON.Vector3(1.3, 0, 1)));
    }

    // removes menu assassins as to not be seen in other pages
    clearMenuAssassins() {
        this.menuAssassins.forEach(assassin => {
            assassin.dispose();
        });

        this.menuAssassins = [];
    }

    // removes the "placement board"
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

    // renders a nxn board given a pos. Assassins[{i, j}] state the board coordinates if it has an assassin inside. alpha for opacity
    renderBoard(pos, n, assassins, alpha) {
        const { scene, generateBoardCoodinates, createAssassin } = this;

        let coordinates = generateBoardCoodinates(n, pos);
        let boards = [];

        const timeStart = new Date();

        coordinates.forEach((row, i) => {
            row.forEach((pos, j) => {
                let board = BABYLON.Mesh.CreateBox('box' + pos.x + pos.z, 2, scene, false);

                board.position.x = pos.x;
                board.position.y = pos.y;
                board.position.z = pos.z;
                board.scaling.y = 0.2;
                board.material = new BABYLON.StandardMaterial(
                    'board_material',
                    scene
                );
                board.metadata = {
                    type: 'board',
                    assassin: null,
                    index: { i, j }
                };

                board.material.alpha = alpha;

                // bad algo
                assassins.forEach(coordinate => {
                    if(coordinate.i === i && coordinate.j === j) {
                        const assassin = createAssassin(new BABYLON.Vector3(
                            pos.x,
                            pos.y + 0.2,
                            pos.z
                        ));

                        board.metadata.assassin = assassin;
                    }
                });

                const offset = i % 2 ? 1 : 0;

                if((j + offset) % 2 == 0) {
                    board.material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
                }
                else {
                    board.material.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
                }

                boards.push(board);
            });
        });

        const timeEnd = new Date();

        const diff = (timeEnd - timeStart) / 1000;

        console.log(diff);

        return boards;
    }

    // render nxn placement board
    renderInitialBoard(n) {
        const { clearInitialBoard, setCamera, renderBoard } = this;

        clearInitialBoard();

        this.initialBoard = renderBoard(new BABYLON.Vector3(-100, 0, -12), n, [], 0.8);

        setCamera(
            new BABYLON.Vector3(-100, 13 + (n * 1.5), -25 - (n * 1.5)),
            new BABYLON.Vector3(-100, 0, -12)
        );
    }

    // sets the page
    setPage(page) {
        const { setCamera, renderInitialBoard, focusBoard, clearMenuAssassins, clearInitialBoard, renderMenu } = this;

        // hide all ui overlay elements
        const pageRootElement = document.getElementById('page-container');

        Array.from(pageRootElement.children).forEach(page => {
            page.style.display = 'none';
        });

        this.state = page;

        if(page === 'menu') {
            const menuOverlay = document.getElementById('menu-page');
            menuOverlay.style.display = 'flex';

            renderMenu();

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

            // generate solving code here
            // for now let's mock it up using setTimeout
            setTimeout(() => {
                this.solutions = this.solve();

                this.solutionIndex = 0;
                this.renderSolutions();

                if(this.solutions.length) {
                    this.focusSolution(this.solutionIndex);
                }

                this.setPage('solution');
            }, 200);
        }
        else if(page === 'solution') {
            const solutionOverlay = document.getElementById('solution-page');
            solutionOverlay.style.display = 'flex';
        }
    }

    showSolution(index, updateCamera) {
        const { clearSolutionBoard, focusSolution, solutions, renderBoard } = this;

        const solution = solutions[index];

        clearSolutionBoard();

        const base = new BABYLON.Vector3(0, 0 , 0);

        // check for assassins
        const assassins = [];

        solution.forEach((row, i) => {
            row.forEach((cell, j) => {
                if(cell === 1) {
                    assassins.push({ i, j });
                }
            });
        });

        const board = renderBoard(base, solution.length, assassins, 1);

        this.solutionBoard = {
            origin: base,
            board
        };

        if(updateCamera) {
            focusSolution();
        }
    }

    renderSolutions() {
        const { showSolution, solutions, renderBoard } = this;

        const solutionText = document.getElementById('solution-text');
        const backSolution = document.getElementById('back-solution');
        const nextSolution = document.getElementById('next-solution');

        if(solutions.length > 0) {
            solutionText.innerText = '1/' + solutions.length + ' Solutions';
            backSolution.style.visibility = 'hidden';

            if(solutions.length > 1) {
                nextSolution.style.visibility = 'visible';
            }
            else {
                nextSolution.style.visibility = 'hidden';
            }
            
        }
        else {
            solutionText.innerText = 'No Solutions';
            backSolution.style.visibility = 'hidden';
            nextSolution.style.visibility = 'hidden';

            return;
        }

        showSolution(0, true);
    }

    focusBoard(board) {
        const { focusAssassin } = this;

        board.forEach(mesh => {
            mesh.visibility = true;
            mesh.material.alpha = 1;

            if(mesh.metadata.assassin) {
                focusAssassin(mesh.metadata.assassin);
            }
        });
    }

    blurBoard(board) {
        const { blurAssassin, solutions } = this;

        board.forEach(mesh => {
            if(solutions.length > 50) {
                mesh.visibility = false;
            }
            else {
                mesh.material.alpha = 0.2;
            }

            if(mesh.metadata.assassin) {
                blurAssassin(mesh.metadata.assassin);
            }
        });
    }

    focusAssassin(assassin) {
        const children = assassin.getChildMeshes(false);

        children.forEach(child => {
            child.visibility = true;
            // child.material.alpha = 1;
        });
    }

    blurAssassin(assassin) {
        const children = assassin.getChildMeshes(false);

        children.forEach(child => {
            child.visibility = false;
            // child.material.alpha = 0.2;
        });
    }

    focusSolution() {
        const solution = this.solutionBoard;
        const N = solution.board.length;
        const pos = solution.origin;

        const { focusBoard, blurBoard, setCamera } = this;

        setCamera(
            new BABYLON.Vector3(pos.x, 10 + (N * 0.5), pos.z - (10 + (N * 0.5))),
            new BABYLON.Vector3(pos.x, pos.y , pos.z),
            true
        );
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

        const { i, j } = mesh.metadata.index;

        this.initialBoardState[i][j] = this.initialBoardState[i][j] === 0 ? 1 : 0;
    }

    disposeAssassin(assassin) {
        const children = assassin.getChildMeshes(false);

        children.forEach(child => {
            child.dispose();
        });

        assassin.dispose();

        return null;
    }

    backSolution() {
        const { showSolution } = this;

        if(this.solutionIndex > 0) {
            showSolution(--this.solutionIndex);

            const solutionText = document.getElementById('solution-text');

            solutionText.innerText = (this.solutionIndex + 1) + '/' + this.solutions.length + ' Solutions';

            if(this.solutionIndex === 0) {
                const backSolutionBtn = document.getElementById('back-solution');

                backSolutionBtn.style.visibility = 'hidden';
            }

            const nextSolutionBtn = document.getElementById('next-solution');

            nextSolutionBtn.style.visibility = 'visible';
        }
    }

    nextSolution() {
        const { showSolution } = this;

        if(this.solutionIndex < this.solutions.length) {
            showSolution(++this.solutionIndex);

            const solutionText = document.getElementById('solution-text');

            solutionText.innerText = (this.solutionIndex + 1) + '/' + this.solutions.length + ' Solutions';

            if(this.solutionIndex === this.solutions.length - 1) {
                const nextSolutionBtn = document.getElementById('next-solution');

                nextSolutionBtn.style.visibility = 'hidden';
            }

            const backSolutionBtn = document.getElementById('back-solution');

            backSolutionBtn.style.visibility = 'visible';
        }
    }

    clearSolutionBoard() {
        if(!this.solutionBoard) {
            return;
        }

        this.solutionBoard.board.forEach(cell => {
            if(cell.metadata && cell.metadata.assassin) {
                const children = cell.metadata.assassin.getChildMeshes(false);

                children.forEach(child => {
                        child.dispose();
                });

                cell.metadata.assassin.dispose();
            }

            cell.dispose();
        });

        this.solutionBoard = null;
    }

    clearSolutions() {
        this.solutions = [];
        this.clearSolutionBoard();
        this.solutionIndex = 0;
    }

    initializePlacementBoard(n) {
        this.initialBoardState = [];

        for(let i = 0; i < n; i++) {
            this.initialBoardState[i] = [];

            for(let j = 0; j < n; j++) {
                this.initialBoardState[i][j] = 0;
            }
        }
    }

    //this is where the solving algorithm (backtracking) happens
    solve() {
        // initial board here and n
        const { initialBoardState, n } = this;

        let solutions = solver(initialBoardState);

        return solutions;
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
    AppInstance.initializePlacementBoard(n);
};

const nInputBtn = document.getElementById('n-input-btn');

nInputBtn.onclick = () => {
    const n = parseInt(nInput.value);

    if(isNaN(n)) {
        return false;
    }

    AppInstance.setPage('initial-placement');
    nInput.value = '';
};

const solveBtn = document.getElementById('solve-btn');

solveBtn.onclick = () => {
    AppInstance.setPage('solving');
};

const restartBtn = document.getElementById('restart-btn');

restartBtn.onclick = () => {
    AppInstance.clearSolutions();
    AppInstance.setPage('menu');
};

const backSolutionBtn = document.getElementById('back-solution');

backSolutionBtn.onclick = () => {
    AppInstance.backSolution();
};

const nextSolutionBtn = document.getElementById('next-solution');

nextSolutionBtn.onclick = () => {
    AppInstance.nextSolution();
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
