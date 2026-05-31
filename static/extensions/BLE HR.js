(function(Scratch) {
    'use strict';

    if (!Scratch.extensions.unsandboxed) {
        throw new Error('Please un sandbox extention.');
    }

    let device = null;
    let server = null;
    let characteristic = null;
    let bpm = 0;
    let connected = false;
    let lastError = '';

    const HEART_RATE_SERVICE = 'heart_rate';
    const HEART_RATE_MEASUREMENT =
        '00002a37-0000-1000-8000-00805f9b34fb';

    class HeartRateBLE {
        getInfo() {
            return {
                id: 'heartrateble',
                name: 'Heart Rate BLE',
                blocks: [
                    {
                        opcode: 'connect',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'connect HR belt'
                    },
                    {
                        opcode: 'getBPM',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'current BPM'
                    },
                    {
                        opcode: 'isConnected',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'connected?'
                    },
                    {
                        opcode: 'getError',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'last error'
                    }
                ]
            };
        }

        async connect() {
            try {
                lastError = '';
                bpm = 0;

                device = await navigator.bluetooth.requestDevice({
                    filters: [{
                        services: [HEART_RATE_SERVICE]
                    }],
                    optionalServices: [HEART_RATE_SERVICE]
                });

                device.addEventListener(
                    'gattserverdisconnected',
                    () => {
                        connected = false;
                    }
                );

                server = await device.gatt.connect();

                const service =
                    await server.getPrimaryService(
                        HEART_RATE_SERVICE
                    );

                characteristic =
                    await service.getCharacteristic(
                        HEART_RATE_MEASUREMENT
                    );

                await characteristic.startNotifications();

                characteristic.addEventListener(
                    'characteristicvaluechanged',
                    event => {
                        const value = event.target.value;
                        const flags = value.getUint8(0);

                        if (flags & 0x01) {
                            bpm = value.getUint16(1, true);
                        } else {
                            bpm = value.getUint8(1);
                        }
                    }
                );

                connected = true;

            } catch (err) {
                connected = false;
                lastError = String(err);
                console.error(err);
            }
        }

        getBPM() {
            return bpm;
        }

        isConnected() {
            return connected;
        }

        getError() {
            return lastError;
        }
    }

    Scratch.extensions.register(
        new HeartRateBLE()
    );

})(Scratch);
