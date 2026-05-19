import os
import json
import aio_pika
from handlers.crud_handler import handle_crud

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")


class RabbitMQRPCServer:
    def __init__(self, queue_name: str):
        self.queue_name = queue_name
        self.connection = None

    async def connect(self):
        import asyncio
        for i in range(15):
            try:
                self.connection = await aio_pika.connect_robust(RABBITMQ_URL)
                break
            except Exception as e:
                print(f"RabbitMQ Consumer bağlantı hatası, 3 saniye sonra tekrar deneniyor... ({i+1}/15)")
                await asyncio.sleep(3)
        if not self.connection:
            raise Exception("RabbitMQ'ya bağlanılamadı.")
            
        self.channel = await self.connection.channel()
        self.queue = await self.channel.declare_queue(self.queue_name)
        await self.queue.consume(self.process_request)
        print(f"[*] CRUD consumer dinliyor: '{self.queue_name}'")

    async def process_request(self, message: aio_pika.IncomingMessage):
        async with message.process():
            try:
                request_data = json.loads(message.body.decode())
                response_payload = await handle_crud(request_data)
                response = {"success": True, "payload": response_payload}
            except Exception as e:
                response = {"success": False, "payload": str(e)}

            if message.reply_to:
                await self.channel.default_exchange.publish(
                    aio_pika.Message(
                        body=json.dumps(response).encode(),
                        correlation_id=message.correlation_id,
                    ),
                    routing_key=message.reply_to,
                )
