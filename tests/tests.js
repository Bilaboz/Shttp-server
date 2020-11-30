/*



-------------------------------------------------------------
              Outdated tests
             I will do the new tests one day lol
-------------------------------------------------------------




const expect = require("chai").expect
const { createSocket } = require("dgram");
const net = require("net")

describe("VERBS tests", () => {

    const socket = new net.Socket();
    socket.setEncoding("utf-8");
    socket.connect(8000);

    describe("Hello test", () => {
        it("returns Hello", (done) => {
            socket.once("data", (data) => {
                expect(data).to.equal("Hello\r\n");
                done();
            });
        });
    });

    describe("GET test", () => {
        it("returns the correct definition", (done) => {
            socket.write("GET duco");
            socket.once("data", (data) => {
                expect(data).to.equal("ANSWER Best crypto :)\r\n");
                done();
            });
        });
    });

    describe("SET test", () => {
        it("returns successfull message", (done) => {
            socket.write("SET test test definition");
            socket.once("data", (data) => {
                expect(data).to.equal("Successfully added the definition\r\n");
                done();
            });
        });
        it("added the definition", (done) => {
            socket.write("GET test");
            socket.once("data", (data) => {
                expect(data).to.equal("ANSWER test definition\r\n");
                done();
            });
        });
    });
}); */

