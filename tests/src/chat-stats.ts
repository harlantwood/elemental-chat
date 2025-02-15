import { Orchestrator, Config, InstallAgentsHapps } from '@holochain/tryorama'
import path from 'path'
import * as _ from 'lodash'
import { v4 as uuidv4 } from "uuid";
import { RETRY_DELAY, RETRY_COUNT, localConductorConfig, networkedConductorConfig, installation1agent, installation2agent } from './common'

const delay = ms => new Promise(r => setTimeout(r, ms))

module.exports = async (orchestrator) => {

  orchestrator.registerScenario('test stats', async (s, t) => {
    const config = localConductorConfig;

    const [alice, bob] = await s.players([config, config], false)
    await alice.startup()
    await bob.startup()
    const [[alice_chat_happ]] = await alice.installAgentsHapps(installation1agent)
    const [[bob_chat_happ]] = await bob.installAgentsHapps(installation1agent)
    const [alice_chat] = alice_chat_happ.cells
    const [bob_chat] = bob_chat_happ.cells

    await s.shareAllNodes([alice, bob]);

    // bob declares self as chatter
    await bob_chat.call('chat', 'refresh_chatter', null);
    // alice declares self as chatter
    await alice_chat.call('chat', 'refresh_chatter', null);

    // Create a channel
    const channel_uuid = uuidv4();
    const channel = await alice_chat.call('chat', 'create_channel', { name: "Test Channel", channel: { category: "General", uuid: channel_uuid } });
    console.log("CHANNEL: >>>", channel);

    const msg1 = {
      last_seen: { First: null },
      channel: channel.channel,
      chunk: 0,
      message: {
        uuid: uuidv4(),
        content: "Hello from alice :)",
      }
    }
    const r1 = await alice_chat.call('chat', 'create_message', msg1);
    t.deepEqual(r1.message, msg1.message);

    const msg2 = {
      last_seen: { First: null },
      channel: channel.channel,
      chunk: 1,
      message: {
        uuid: uuidv4(),
        content: "second messages",
      }
    }
    const r2 = await alice_chat.call('chat', 'create_message', msg2);
    t.deepEqual(r2.message, msg2.message);

    const channel_uuid2 = uuidv4();
    const channel2 = await alice_chat.call('chat', 'create_channel', { name: "Test2 Channel", channel: { category: "General", uuid: channel_uuid2 } });

    const msg3 = {
      last_seen: { First: null },
      channel: channel2.channel,
      chunk: 0,
      message: {
        uuid: uuidv4(),
        content: "Hello from bob :)",
      }
    }
    const r3 = await alice_chat.call('chat', 'create_message', msg3);
    t.deepEqual(r3.message, msg3.message);

    let stats = await alice_chat.call('chat', 'stats', {category: "General"});
    t.deepEqual(stats, {agents: 2, active: 2, channels: 2, messages: 3});

    stats = await bob_chat.call('chat', 'stats', {category: "General"});
    t.deepEqual(stats, {agents: 2, active: 2, channels: 2, messages: 3});

  })
}
