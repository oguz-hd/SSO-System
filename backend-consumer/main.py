import asyncio
from core.rabbitmq import RabbitMQRPCServer


async def main():
    server = RabbitMQRPCServer("crud_operations")
    await server.connect()
    await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
