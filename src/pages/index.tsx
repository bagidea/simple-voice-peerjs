import {
  RefObject,
  useEffect,
  useRef,
  useState
} from "react"

import {
  Button,
  createListCollection,
  Flex,
  HStack,
  Image,
  Input,
  ListCollection,
  SelectValueChangeDetails,
  Spinner,
  Text,
  Textarea,
  VStack
} from "@chakra-ui/react"

import {
  ClipboardIconButton,
  ClipboardRoot
} from "@/components/ui/clipboard"

import P2PMain from "@/p2pmain/p2pmain"
import { Toaster } from "@/components/ui/toaster"

import {
  SelectRoot,
  SelectTrigger,
  SelectLabel,
  SelectValueText,
  SelectContent,
  SelectItem
} from "@/components/ui/select"

const audioInputDevices: ListCollection<unknown> = createListCollection({
  items: []
})

const Index = () => {
  const [ isReady, setReady ] = useState<boolean>(false)
  const [ status, setStatus ] = useState<string>("Peer starting...")
  const [ statusColor, setStatusColor ] = useState<string>("rgb(255, 0, 0)")
  const [ peerID, setPeerID ] = useState<string>("")
  const [ isConnected, setConnected ] = useState<boolean>(false)
  const [ logsText, setLogsText ] = useState<string>("[System] Starting...")

  const [ p2pMain, setP2PMain ] = useState<P2PMain | null>(null)

  const inputId: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null)
  const logs: RefObject<HTMLTextAreaElement | null> = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const p2pMain: P2PMain = new P2PMain(
      setReady,
      setStatus,
      setStatusColor,
      setPeerID,
      setConnected,
      inputId.current,
      logsText,
      setLogsText
    )

    p2pMain.getAudioDevice()
    .then((mdis: Array<MediaDeviceInfo>) => {
      //console.log(mdis)

      mdis.forEach((mdi: MediaDeviceInfo) => {
        audioInputDevices.items.push({
          label: mdi.label,
          value: mdi.deviceId
        })
      })
    })

    setP2PMain(p2pMain)
  }, [])

  useEffect(() => {
    if (logs.current) logs.current.scrollTop = logs.current.scrollHeight
  }, [logs.current?.value])

  return (
    <Flex
      w="100vw"
      h="100vh"
      justifyContent="center"
      justifyItems="center"
      alignItems="center"
      bg="linear-gradient(0deg, rgba(0,200, 255,1) 0%, rgb(203, 246, 255) 100%)"
    >
      <VStack>
        <Flex
          p="20px"
          maxW="300px"
          bgColor="rgba(0, 53, 83, 0.8)"
          rounded="15px"
          boxShadow="rgba(0, 0, 0, 0.25) 0px 14px 28px, rgba(0, 0, 0, 0.22) 0px 10px 10px"

        >
          <VStack>
            <Image
              src="images/logo.png"
            />

            <Text
              fontWeight="bold"
            >:: TEAPOT WEBRTC DEMO ::</Text>

            <HStack
              maxW="250px"
            >
              <Text
                color={ statusColor }
                truncate={ true }
              >{ status }</Text>

              <ClipboardRoot
                value={ peerID }
                hidden={ !isReady }
              >
                <ClipboardIconButton />
              </ClipboardRoot>

              <Spinner
                hidden={ isReady }
              />
            </HStack>

            <HStack
              hidden={ isConnected }
            >
              <Input
                ref={ inputId }
                border="0px"
                bgColor="black"
                placeholder="Enter Peer ID"
              />

              <Button
                onClick={ () => {
                    if (inputId.current?.value) p2pMain?.onConnect(inputId.current.value)
                  }
                }
              >CONNECT</Button>
            </HStack>

            <Button
              w="full"
              bgColor="red"
              fontWeight="bold"
              color="white"
              hidden={ !isConnected }
              onClick={ p2pMain?.onDisconnect }
            >DISCONNECT</Button>

            <SelectRoot
              collection={ audioInputDevices }
              onValueChange={ (details: SelectValueChangeDetails<unknown>) => p2pMain?.mediaChange(details.value[0]) }
            >
              <SelectLabel>Select Audio input devices.</SelectLabel>
              <SelectTrigger
                bgColor="black"
                color="white"
              >
                <SelectValueText placeholder="Default - ..." />
              </SelectTrigger>
              <SelectContent
                bgColor="white"
                color="black"
              >
                {
                  audioInputDevices.items.map((audioInput: any) => (
                      <SelectItem
                        item={ audioInput }
                        key={ audioInput.value }
                      >
                        { audioInput.label }
                      </SelectItem>
                    )
                  )
                }
              </SelectContent>
            </SelectRoot>
          </VStack>
        </Flex>

        <Textarea
          ref={ logs }
          minH="200px"
          maxH="200px"
          color="white"
          bgColor="black"
          value={ logsText }
          readOnly={ true }
          rounded="15px"
        />
      </VStack>

      <Toaster />
    </Flex>
  )
}

export default Index