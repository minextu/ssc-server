# SSC Server
Reverse-Engineered Server for [Super Soaker Championship](https://www.helles-koepfchen.de/online_spiele/super_soaker_championship/index.html) implemented in NodeJS.

This allows the game to be played again, since the server went offline quite some time ago.

## Try it out
1. Download the original setup from here: https://archive.org/download/ssc-setup/SuperSoaker.exe
2. Install the Game
3. Download the patcher exectuable pointing to the new server here: https://github.com/minextu/ssc-server/releases/download/v0.1/Start.exe
4. Open the installation folder (i.e. `C:\Program Files (x86)\Super Soaker Championship`)
5. Copy the downloaded `Start.exe` into this folder (override the existing one)

After this you should be able to start the game and let the Patcher (`Start.exe`) download the rest. 

> [!NOTE]
> If the Patcher crashes or fails to download the remaining files, try running it as Administrator. Alternatively you can follow the next step and update the game manually.

### Optional: Update the game files manually
In case the Patcher is not working correctly you can bypass it:

1. Download the original updated game files here: [data_2.dat](https://github.com/minextu/ssc-server/releases/download/v0.1/data_2.dat), [data_3.dat](https://github.com/minextu/ssc-server/releases/download/v0.1/data_3.dat) and [pv.dat](https://github.com/minextu/ssc-server/releases/download/v0.1/pv.dat)
2. Download the patched game exectuable here: [SuperSoaker.exe](https://github.com/minextu/ssc-server/releases/download/v0.1/SuperSoaker.exe)
3. Place all of these files (`data_2.dat`, `data_3.dat`, `pv.dat`, `SuperSoaker.exe`) into the installation folder (i.e. `C:\Program Files (x86)\Super Soaker Championship`) and override the existing files.
4. You can now bypass the Patcher by running `SuperSoaker.exe` directly instead of the desktop shortcut or `Start.exe`.

## Project Background
Super Soaker Championship was programmed in [Blitz3D](https://blitzresearch.itch.io/blitz3d) using BPPro/Lite for Networking. I was able to decompress everything with De-mole-ition and then decomplile using https://github.com/juanjp600/B3DDecomp. This made it much easier to reverse-engineer the server.

### Game Files
Both `.exe` files and all the assets are compressed using Molebox.

- `Start.exe`: Connects to patch server via TCP and updates game files if necessary, comparing against `pv.dat`
- `pv.dat`: XOR encrypted version codes for all files
- `SuperSoaker.exe`: Main game executable, connects to master server via TCP to verify username and show the list of game servers (skipped when only one game server is available). Then connects to the selected game server via UDP. Communication is based on BPPro, but has been adjusted to support the game states.
- `data_2.dat`, `data_3.dat`: Molebox compressed resources (textures, sounds, etc) for `SuperSoaker.exe`

### Encryption
The patcher and master server both use a basic form of XOR encryption with a hardcoded string. The game server uses multiple strings. More details can be found in the source code: https://github.com/minextu/ssc-server/blob/v0.1/src/utils/encryption.ts

## Development
Development requires the game exectuable to be patched and the secrets to be extracted first. You will need a hexeditor. More details about this will be added here at a later point.

Then either run the server through docker (https://hub.docker.com/repository/docker/minextu/ssc-server) or
1. Download/clone this repo
2. Run `npm install`
3. Copy `.env.example` to `.env`
4. Extract secrets from game exectuable and fill `PATCH_SECRET`, `MASTER_SECRET` and `GAME_SECRETS` in the `.env`
5. Patch game exectuables to connect to your ip (i.e. `127.0.0.1`)
6. Run patch, master and game servers with `npm run dev`

## Missing Features
- [x] Team Mode
- [ ] Fix Player Hitbox
    - Collision detection is handled on the server, there is a very basic detection [here](https://github.com/minextu/ssc-server/blob/0e849d6247f02cec1e294a9c61d4b29609069975/src/game/state/shot.ts#L220) but currently this is not working like it should, causing shots to be missed.
- [ ] Figure out weapon damages
    - Each weapon has it's own damage value. But since this was only ever calculated on the server, the actual damage each weapon used to do is unknown.
- [x] Kick functionality
- [ ] IP Banning
