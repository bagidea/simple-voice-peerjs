import {
    Dispatch,
    SetStateAction
} from "react"

import { toaster } from "@/components/ui/toaster"

import Peer,
{
    DataConnection,
    MediaConnection
} from "peerjs"

class P2PMain {
    private peer: Peer
    private conn: DataConnection | null
    private connFailed: Array<DataConnection> = new Array<DataConnection>()
    private mediaConn: MediaConnection | null
    private mediaStream: MediaStream | null

    private setReady: Dispatch<SetStateAction<boolean>>
    private setStatus: Dispatch<SetStateAction<string>>
    private setStatusColor: Dispatch<SetStateAction<string>>
    private setPeerID: Dispatch<SetStateAction<string>>
    private setConnected: Dispatch<SetStateAction<boolean>>

    private state: string = ""
    private inputId: HTMLInputElement | null
    private logsText: string
    private setLogsText: Dispatch<SetStateAction<string>>

    constructor(
        setReady: Dispatch<SetStateAction<boolean>>,
        setStatus: Dispatch<SetStateAction<string>>,
        setStatusColor: Dispatch<SetStateAction<string>>,
        setPeerID: Dispatch<SetStateAction<string>>,
        setConnected: Dispatch<SetStateAction<boolean>>,
        inputId: HTMLInputElement | null,
        logsText: string,
        setLogsText: Dispatch<SetStateAction<string>>
    ) {
        this.setReady = setReady
        this.setStatus = setStatus
        this.setStatusColor = setStatusColor
        this.setPeerID = setPeerID
        this.setConnected = setConnected

        this.inputId = inputId
        this.logsText = logsText
        this.setLogsText = setLogsText

        this.conn = null
        this.mediaConn = null
        this.mediaStream = null

        console.log("Peer started.")

        this.peer = new Peer()
        this.peer.on("open", this.open)
        this.peer.on("connection", this.connected)
        this.peer.on("call", this.offerCalled)
        this.peer.on('error', (err) => {
            //console.log(err)

            this.conn?.close()
            this.mediaConn?.close()
            if (this.inputId) this.inputId.value = ""
            this.notification("Error connected peer ID.", "Error", "error")
            this.addLogs("Error connected peer ID.", "System")
        })

        /*this.getAudioDevice()
        .then((mdis: Array<MediaDeviceInfo>) => {
            console.log(mdis)

            mdis.forEach((mdi: MediaDeviceInfo) => {
                console.log(mdi.label)
            })
        })*/

        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then((ms: MediaStream) => this.mediaStream = ms)
        .catch(console.error)
    }

    private addLogs = (text: string, sender: string) => {
        this.logsText += "\n["+sender+"] "+text
        this.setLogsText(this.logsText)
    }

    private open = (id: string) => {
        console.log("You peer ID: "+id)

        this.setStatus("ID: "+id)
        this.setStatusColor("rgb(0, 255, 0)")
        this.setPeerID(id)
        this.setReady(true)

        this.addLogs("You peer ID: "+id, "System")
    }

    private connected = (conn: DataConnection) => {
        console.log("ID: "+conn.peer+" has Connected.")
        conn.on('data', this.dataReceived)

        if (this.state == "") {
            this.conn = conn
            this.state = "HOST"
            this.setConnected(true)

            this.notification("Successfuly to connected.")
            this.addLogs("ID: "+conn.peer+" has Connected.", "System")

            if (this.mediaStream) {
                this.mediaConn = this.peer.call(conn.peer, this.mediaStream)
                this.mediaConn.on("stream", this.onStream)
                this.mediaConn.on("close", this.mediaClosed)
            }
        } else {
            this.connFailed.push(conn)
        }
    }

    private mediaClosed = () => {
        console.log("Media Disconnected.")

        this.notification("Media closed.", "Media Closed", "error")
        this.addLogs("Media closed.", "System")

        this.state = ""
        this.setConnected(false)

        this.conn = null
        this.mediaConn = null
        if (this.inputId) this.inputId.value = ""
    }

    private offerCalled = (mediaConn: MediaConnection) => {
        this.mediaConn = mediaConn

        if (this.mediaStream) {
            this.mediaConn.answer(this.mediaStream)
            this.mediaConn.on('stream', this.onStream)
            this.mediaConn.on("close", this.mediaClosed)
        }
    }

    private onStream = (remoteMediaStream: MediaStream) => {
        const audio: HTMLAudioElement = new Audio()
        audio.srcObject = remoteMediaStream
        audio.play()

        this.notification("Audio stream...", "Online", "info")
        this.addLogs("Audio streaming...", "System")
    }

    private connOpenned = () => {
        console.log("you have Connected.")
        this.conn?.on('data', this.dataReceived)
        this.conn?.send("Hello Server.")
        this.state = "CLIENT"
        this.setConnected(true)

        this.notification("Successfuly to connected.")
        this.addLogs("You have connected.", "System")
    }

    private dataReceived = (data: unknown) => {
        console.log(data)

        if (data == "Hello Server.") {
            if (this.state == "HOST") {
                this.conn?.send("OK.")
            }

            if (this.state != "") {
                this.connFailed.forEach((conn: DataConnection) => {
                    conn.send("NOT_CONNECTED")
                })

                this.connFailed = new Array<DataConnection>()
            }
        } else if (data == "NOT_CONNECTED") { this.onDisconnect() }
    }

    private notification = (text: string, title: string = "Success", type: string = "success") => {
        toaster.create({
            description: text,
            title: title,
            type: type,
            placement: "bottom-end"
        })

        //console.log(toaster.getPlacements())
    }

    onConnect = (id: string) => {
        if (id == this.peer.id) {
            this.conn?.close()
            this.mediaConn?.close()
            if (this.inputId) this.inputId.value = ""
            this.notification("Can't connected your peer ID.", "Error", "error")
            this.addLogs("Can't connected your peer ID.", "System")

            return
        }

        console.log("Connect ID: "+id)

        this.conn = this.peer.connect(id)
        this.conn.on('open', this.connOpenned)
    }
    
    onDisconnect = () => {
        this.notification("You have disconnected.", "Disconnected", "error")
        this.addLogs("You have disconnected.", "System")

        this.state = ""
        this.setConnected(false)

        this.conn?.close()
        this.mediaConn?.close()
        if (this.inputId) this.inputId.value = ""
        this.state = ""
    }

    getAudioDevice = async () => {
        const devices = await navigator.mediaDevices.enumerateDevices()
        return devices.filter((mdi: MediaDeviceInfo) => mdi.kind == "audioinput")
    }

    private switchMediaStream = async (mediaStream: MediaStream) => {
        const sender: RTCRtpSender | undefined = this.mediaConn?.peerConnection.getSenders().find((s: RTCRtpSender) => s.track?.kind)

        if (sender) {
            await sender.replaceTrack(mediaStream.getAudioTracks()[0])

            this.notification("Switch Audio Device.", "Audio", "success")
            this.addLogs("Switch Audio Device.", "System")
        }

        this.mediaStream = mediaStream
    }

    private switchAudioInputDevice = async (deviceId: string) => {
        const newMediaStream: MediaStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: deviceId } },
            video: false
        })

        this.switchMediaStream(newMediaStream)
    }

    mediaChange = (deviceId: string) => {
        console.log(deviceId)
        this.switchAudioInputDevice(deviceId)
    }
}

export default P2PMain