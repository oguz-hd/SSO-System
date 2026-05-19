import os
import json
import uuid
import asyncio
import aio_pika
from typing import Dict, Any

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")

class RabbitMQRPCClient:
    def __init__(self):
        self.connection = None
        self.channel = None
        self.callback_queue = None
        self.futures: Dict[str, asyncio.Future] = {}

    async def connect(self):
        import asyncio
        for i in range(15):
            try:
                self.connection = await aio_pika.connect_robust(RABBITMQ_URL)
                break
            except Exception as e:
                print(f"RabbitMQ RPC Client bağlantı hatası, 3 saniye sonra tekrar deneniyor... ({i+1}/15)")
                await asyncio.sleep(3)
        if not self.connection:
            raise Exception("RabbitMQ'ya bağlanılamadı.")
            
        self.channel = await self.connection.channel()
        # RPC yanıt kuyruğu
        self.callback_queue = await self.channel.declare_queue(exclusive=True)
        await self.callback_queue.consume(self.on_response, no_ack=True)

    # Async response handler
    async def on_response(self, message: aio_pika.IncomingMessage):
        future = self.futures.pop(message.correlation_id, None)
        if future and not future.done():
            future.set_result(json.loads(message.body.decode()))

    async def call(self, queue_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        if not self.connection:
            await self.connect()

        loop = asyncio.get_running_loop()
        correlation_id = str(uuid.uuid4())
        future = loop.create_future()
        self.futures[correlation_id] = future

        message = aio_pika.Message(
            body=json.dumps(payload).encode(),
            correlation_id=correlation_id,
            reply_to=self.callback_queue.name
        )

        await self.channel.default_exchange.publish(
            message,
            routing_key=queue_name
        )
        return await future


class RabbitMQRPCServer:
    def __init__(self, queue_name: str, handler):
        self.queue_name = queue_name
        self.handler = handler
        self.connection = None

    async def connect(self):
        self.connection = await aio_pika.connect_robust(RABBITMQ_URL)
        self.channel = await self.connection.channel()
        self.queue = await self.channel.declare_queue(self.queue_name)
        await self.queue.consume(self.process_request)
        print(f"[*] kuyrukta rpc mesajları bekleniyor '{self.queue_name}'")

    async def process_request(self, message: aio_pika.IncomingMessage):
        async with message.process():
            try:
                request_data = json.loads(message.body.decode())
                response_payload = await self.handler(request_data)

                response = {
                    "success": True,
                    "payload": response_payload
                }
            except Exception as e:
                response = {
                    "success": False,
                    "payload": str(e)
                }

            if message.reply_to:
                await self.channel.default_exchange.publish(
                    aio_pika.Message(
                        body=json.dumps(response).encode(),
                        correlation_id=message.correlation_id
                    ),
                    routing_key=message.reply_to
                )

rpc_client = RabbitMQRPCClient()
